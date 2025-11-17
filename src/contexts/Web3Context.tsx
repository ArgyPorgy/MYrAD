import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { Web3State } from '@/types/web3';
import { getApiUrl } from '@/config/api';

interface Web3ContextType extends Web3State {
  status: string;
  setStatus: (status: string) => void;
  connectWallet: (connectorId?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

const SIGNATURE_STORAGE_PREFIX = 'myrad-signature-wagmi';

const buildSignatureStorageKey = (address: string) =>
  `${SIGNATURE_STORAGE_PREFIX}-${address.toLowerCase()}`;

const buildSignMessage = (address: string) => {
  const timestamp = new Date().toISOString();
  return `Sign in to MYrAD\nAddress: ${address}\nTimestamp: ${timestamp}`;
};

const trackWalletConnection = async (walletAddress: string) => {
  try {
    const response = await fetch(getApiUrl('/track-wallet'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    });
    
    if (!response.ok) {
      console.warn('Failed to track wallet connection:', response.statusText);
    }
  } catch (error) {
    // Silently fail - don't interrupt user flow if tracking fails
    console.warn('Error tracking wallet connection:', error);
  }
};

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected, connector, chain } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();

  const [status, setStatus] = useState<string>('');
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const isRequestingSignatureRef = useRef(false);

  // Initialize provider and signer when account connects
  useEffect(() => {
    const initializeProvider = async () => {
      // Check if user manually disconnected
      const userDisconnected = localStorage.getItem('wallet-disconnected');
      if (userDisconnected === 'true') {
        console.log('User manually disconnected, skipping auto-reconnect');
        return;
      }

      if (!isConnected || !address || !connector) {
        setProvider(null);
        setSigner(null);
        setSignedIn(false);
        setIsReconnecting(false);
        return;
      }

      try {
        setIsReconnecting(true);
        console.log('🔌 Initializing provider for address:', address);
        
        // Get the EIP-1193 provider from wagmi connector
        let walletClient;
        if (typeof connector.getProvider === 'function') {
          walletClient = await connector.getProvider();
        } else if (connector.provider) {
          walletClient = connector.provider;
        } else {
          // Fallback to window.ethereum
          walletClient = window.ethereum;
        }
        
        const ethersProvider = new BrowserProvider(walletClient as any);
        const ethersSigner = await ethersProvider.getSigner();

        setProvider(ethersProvider);
        setSigner(ethersSigner);

        // Check if signature exists
        const signatureKey = buildSignatureStorageKey(address);
        const storedSignature = localStorage.getItem(signatureKey);
        console.log('Checking signature for', address);
        console.log('Storage key:', signatureKey);
        console.log('Signature exists:', !!storedSignature);

        if (storedSignature) {
          console.log('Found existing signature, auto-signing in');
          setSignedIn(true);
          setStatus(`Wallet connected: ${address} (Base Sepolia testnet)`);
          setIsReconnecting(false);
          // Track wallet connection on auto-reconnect
          void trackWalletConnection(address);
        } else if (!isRequestingSignatureRef.current) {
          console.log('No signature found, requesting new one');
          isRequestingSignatureRef.current = true;
          // Request signature
          try {
            await requestSignature(address);
          } finally {
            isRequestingSignatureRef.current = false;
            setIsReconnecting(false);
          }
        } else {
          console.log('Signature request already in progress, skipping');
          setIsReconnecting(false);
        }
      } catch (error) {
        console.error('Error initializing provider:', error);
        setProvider(null);
        setSigner(null);
        setSignedIn(false);
        setIsReconnecting(false);
      }
    };

    void initializeProvider();
  }, [isConnected, address, connector]);

  // Ensure correct network
  useEffect(() => {
    const ensureCorrectChain = async () => {
      if (isConnected && chain?.id !== baseSepolia.id && switchChainAsync) {
        try {
          setStatus('Switching to Base Sepolia...');
          await switchChainAsync({ chainId: baseSepolia.id });
          setStatus('Switched to Base Sepolia');
        } catch (error: any) {
          console.error('Failed to switch chain:', error);
          if (error.code !== 4001) {
            setStatus('Please switch to Base Sepolia testnet manually');
          }
        }
      }
    };

    void ensureCorrectChain();
  }, [isConnected, chain, switchChainAsync]);

  const requestSignature = async (walletAddress: string) => {
    try {
      const storageKey = buildSignatureStorageKey(walletAddress);
      const existingSignature = localStorage.getItem(storageKey);

      console.log('requestSignature called for:', walletAddress);
      console.log('Checking storage key:', storageKey);
      console.log('Existing signature:', !!existingSignature);

      if (existingSignature) {
        console.log('Signature already exists, skipping sign request');
        setSignedIn(true);
        return;
      }

      const message = buildSignMessage(walletAddress);
      setStatus('Please sign the message to authenticate...');

      console.log('Requesting signature via Wagmi...');
      const signature = await signMessageAsync({ message });
      console.log('Signature received:', signature.substring(0, 20) + '...');

      const signatureData = JSON.stringify({
        signature,
        message,
        timestamp: Date.now(),
      });

      localStorage.setItem(storageKey, signatureData);
      console.log('Signature saved to localStorage with key:', storageKey);
      
      // Verify it was saved
      const verification = localStorage.getItem(storageKey);
      console.log('Verification - signature saved:', !!verification);
      
      setSignedIn(true);
      setStatus('Signed in successfully');
      
      // Track wallet connection after successful sign-in
      void trackWalletConnection(walletAddress);
    } catch (error: any) {
      console.error('Signature error:', error);
      if (error.name !== 'UserRejectedRequestError' && error.code !== 4001) {
        setStatus('Signature required to continue');
      }
      // Disconnect if signature is declined
      await disconnectAsync();
      setSignedIn(false);
    }
  };

  const connectWallet = useCallback(
    async (connectorId?: string) => {
      try {
        if (!connectorId) {
          // Open modal by dispatching event
          window.dispatchEvent(new CustomEvent('openWalletModal'));
          return;
        }

        setStatus('Connecting wallet...');

        // Find the connector
        let selectedConnector = connectors.find((c) => {
          if (connectorId === 'metamask') {
            // Check multiple possible IDs and names for MetaMask
            return c.id === 'io.metamask' || 
                   c.id === 'metaMaskSDK' ||
                   c.name?.toLowerCase().includes('metamask') ||
                   (c.type === 'injected' && typeof window !== 'undefined' && 
                    (window as any).ethereum?.isMetaMask && 
                    !(window as any).ethereum?.isRabby && 
                    !(window as any).ethereum?.isOkxWallet);
          }
          if (connectorId === 'rabby') return c.id === 'rabby';
          if (connectorId === 'okx') return c.id === 'okx';
          if (connectorId === 'coinbase') return c.id === 'coinbaseWalletSDK' || c.id === 'coinbaseWallet';
          if (connectorId === 'walletconnect') return c.id === 'walletConnect' || c.id === 'walletConnect';
          return false;
        });

        // Fallback for MetaMask - try to find injected connector that is MetaMask
        if (!selectedConnector && connectorId === 'metamask') {
          selectedConnector = connectors.find((c) => {
            if (c.type === 'injected' && typeof window !== 'undefined') {
              const ethereum = (window as any).ethereum;
              return ethereum?.isMetaMask && !ethereum?.isRabby && !ethereum?.isOkxWallet;
            }
            return false;
          });
        }

        // Fallback to injected if specific connector not found (but not for walletconnect)
        if (!selectedConnector && connectorId !== 'walletconnect' && connectorId !== 'metamask') {
          selectedConnector = connectors.find((c) => c.type === 'injected');
        }

        if (!selectedConnector) {
          throw new Error(`Connector ${connectorId} not found`);
        }

        // Clear disconnect flag before connecting
        localStorage.removeItem('wallet-disconnected');
        
        const result = await connectAsync({ connector: selectedConnector, chainId: baseSepolia.id });
        
        if (result.accounts && result.accounts.length > 0) {
          console.log('Wallet connected successfully:', result.accounts[0]);
          // Provider and signature will be handled by useEffect
        }
      } catch (error: any) {
        console.error('Connect error:', error);
        if (error.code !== 4001) {
          setStatus(`Connection failed: ${error.message}`);
        }
      }
    },
    [connectors, connectAsync]
  );

  const disconnectWallet = useCallback(async () => {
    try {
      // Clear signature BEFORE disconnecting to prevent sign request
      if (address) {
        const signatureKey = buildSignatureStorageKey(address);
        localStorage.removeItem(signatureKey);
        console.log('Cleared signature for:', address);
      }
      
      // Set disconnect flag BEFORE calling disconnectAsync
      localStorage.setItem('wallet-disconnected', 'true');
      
      // Clear state immediately
      setProvider(null);
      setSigner(null);
      setSignedIn(false);
      setIsReconnecting(false);
      setStatus('');
      
      // Now disconnect from Wagmi
      await disconnectAsync();
      
      console.log('Disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [disconnectAsync, address]);

  const web3State: Web3ContextType = {
    provider,
    signer,
    userAddress: address || '',
    connected: isConnected && signedIn && chain?.id === baseSepolia.id && !isReconnecting,
    status,
    setStatus,
    connectWallet,
    disconnectWallet,
  };

  return <Web3Context.Provider value={web3State}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
