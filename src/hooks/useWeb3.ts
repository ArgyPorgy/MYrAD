import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { Web3Modal } from '@web3modal/standalone';
import { Web3State } from '@/types/web3';
import { switchToBaseSepolia, checkNetwork } from '@/utils/web3';
import { BASE_SEPOLIA_CHAIN_ID } from '@/constants/contracts';

const SIGNATURE_STORAGE_PREFIX = 'myrad-signature';

const buildSignatureStorageKey = (address: string) =>
  `${SIGNATURE_STORAGE_PREFIX}-${address.toLowerCase()}`;

const buildSignMessage = (address: string) => {
  const timestamp = new Date().toISOString();
  return `Sign in to MYrAD\nAddress: ${address}\nTimestamp: ${timestamp}`;
};

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    userAddress: '',
    connected: false,
  });
  const [status, setStatus] = useState<string>('');
  const walletConnectRef = useRef<any>(null);
  const walletConnectModalRef = useRef<any>(null);
  const isConnectingRef = useRef<boolean>(false);

  const clearState = useCallback(() => {
    setWeb3State({
      provider: null,
      signer: null,
      userAddress: '',
      connected: false,
    });
  }, []);

  const ensureSignature = useCallback(
    async (signer: ethers.Signer, address: string) => {
      const storageKey = buildSignatureStorageKey(address);
      const existingSignature = localStorage.getItem(storageKey);
      console.log('🔑 Checking signature for', address);
      console.log('🔑 Storage key:', storageKey);
      console.log('🔑 Signature exists:', !!existingSignature);
      console.log('🔑 Signature value:', existingSignature);
      
      if (existingSignature) {
        console.log('✅ Found existing signature, skipping sign request');
        return existingSignature;
      }

      const message = buildSignMessage(address);

      setStatus('🔐 Awaiting signature to sign in to MYrAD...');
      console.log('📝 Requesting new signature for', address);
      console.log('📝 Message to sign:', message);
      try {
        const signature = await signer.signMessage(message);
        const signatureData = JSON.stringify({
          signature,
          message,
          timestamp: Date.now(),
        });
        localStorage.setItem(storageKey, signatureData);
        console.log('💾 Signature saved to localStorage with key:', storageKey);
        console.log('💾 Saved data:', signatureData);
        
        // Verify it was saved
        const verification = localStorage.getItem(storageKey);
        console.log('✅ Verification - signature saved:', !!verification);
        
        setStatus('✅ Signed in to MYrAD successfully');
        return signature;
      } catch (error: any) {
        console.warn('User declined MYrAD sign-in signature', error);
        throw new Error(
          error?.message ?? 'Signature declined. Sign in is required to continue.'
        );
      }
    },
    []
  );

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      // Don't check if we're actively connecting
      if (isConnectingRef.current) {
        console.log('⏭️ Skipping checkExistingConnection - actively connecting');
        return;
      }

      if (typeof window === 'undefined' || !window.ethereum) return;

      console.log('🔍 checkExistingConnection running...');

      const userDisconnected = localStorage.getItem('wallet-disconnected');
      if (userDisconnected === 'true') {
        console.log('❌ User previously disconnected, skipping auto-connect');
        return;
      }

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        console.log('📋 Found accounts:', accounts);
        
        if (accounts.length === 0) {
          console.log('❌ No accounts found');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const signatureKey = buildSignatureStorageKey(userAddress);
        const signatureData = localStorage.getItem(signatureKey);
        console.log('🔑 Signature check for', userAddress);
        console.log('🔑 Expected storage key:', signatureKey);
        console.log('🔑 Signature exists:', !!signatureData);
        console.log('🔑 All localStorage keys:', Object.keys(localStorage));
        console.log('🔑 Keys matching "myrad-signature":', Object.keys(localStorage).filter(k => k.includes('myrad-signature')));
        
        if (!signatureData) {
          console.log('⚠️ No signature found, clearing state');
          setStatus('⚠️ Sign in required. Please reconnect and sign in to continue.');
          clearState();
          return;
        }
        
        console.log('✅ Signature found, proceeding with auto-connect');

        const isCorrectNetwork = await checkNetwork(provider);
        if (!isCorrectNetwork) {
          console.log('❌ Wrong network detected');
          setStatus('❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)');
          clearState();
          return;
        }

        console.log('✅ Auto-connecting to existing session');
        setWeb3State({
          provider,
          signer,
          userAddress,
          connected: true,
        });
        setStatus(`✅ Wallet connected: ${userAddress} (Base Sepolia testnet)`);
      } catch (err) {
        console.error('Check existing connection error:', err);
      }
    };

    void checkExistingConnection();

    const handleAccountsChanged = async (accounts: string[]) => {
      // Ignore account changes while actively connecting
      if (isConnectingRef.current) {
        console.log('🔄 Ignoring accountsChanged event during active connection');
        return;
      }

      console.log('👤 accountsChanged event:', accounts);

      if (accounts.length === 0) {
        clearState();
        setStatus('');
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const isCorrectNetwork = await checkNetwork(provider);
        if (!isCorrectNetwork) {
          setStatus('❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)');
          clearState();
          return;
        }

        const signatureKey = buildSignatureStorageKey(userAddress);
        if (!localStorage.getItem(signatureKey)) {
          setStatus('⚠️ Sign in required. Please reconnect and sign in to continue.');
          clearState();
          return;
        }

        setWeb3State({
          provider,
          signer,
          userAddress,
          connected: true,
        });
        localStorage.removeItem('wallet-disconnected');
        setStatus(`✅ Wallet connected: ${userAddress} (Base Sepolia testnet)`);
      } catch (err) {
        console.error('Account change error:', err);
        setStatus(`❌ Account change failed: ${(err as any)?.message ?? 'Unknown error'}`);
      }
    };

    const handleChainChanged = async () => {
      if (!web3State.connected || !web3State.provider) return;
      const isCorrectNetwork = await checkNetwork(web3State.provider);
      if (isCorrectNetwork) {
        setStatus(`✅ Wallet connected: ${web3State.userAddress} (Base Sepolia testnet)`);
      } else {
        setStatus('❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)');
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [clearState, web3State.connected, web3State.provider]);

  const connectWallet = useCallback(
    async (providerType?: string) => {
      try {
        if (typeof window === 'undefined') {
          throw new Error('Window context unavailable');
        }

        const dispatchWalletModal = () => {
          window.dispatchEvent(new CustomEvent('openWalletModal'));
          setStatus('🔔 Select a wallet to connect.');
        };

        if (!providerType) {
          dispatchWalletModal();
          return;
        }

        // Set connecting flag to prevent accountsChanged from interfering
        isConnectingRef.current = true;
        console.log('🔌 Starting connection process...');

        const aggregator = window.ethereum;
        const providerList: any[] = Array.isArray((aggregator as any)?.providers)
          ? (aggregator as any).providers
          : [];

        const matchProvider = (
          identifiers: Array<(provider: any) => boolean>,
          fallback?: () => any | null
        ): any | null => {
          if (providerList.length) {
            const found = providerList.find((provider: any) =>
              identifiers.some((fn) => {
                try {
                  return fn(provider);
                } catch {
                  return false;
                }
              })
            );
            if (found) {
              return found;
            }
          }
          if (fallback) {
            try {
              return fallback();
            } catch {
              return null;
            }
          }
          return null;
        };

        const requestAccounts = async (eth: any) => {
          if (!eth) {
            throw new Error('Wallet provider unavailable.');
          }
          if (typeof eth.enable === 'function' && providerType === 'walletconnect') {
            await eth.enable();
          } else {
            await eth.request?.({ method: 'eth_requestAccounts' });
          }
        };

        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
        let ethereumProvider: any = null;

        if (providerType === 'metamask') {
          ethereumProvider = matchProvider(
            [
              (p) => {
                const name = (p?.providerInfo?.name || '').toLowerCase();
                const rdns = (p?.providerInfo?.rdns || '').toLowerCase();
                return p?.isMetaMask || name.includes('metamask') || rdns.includes('metamask');
              },
              (p) => p?.isMetaMask && !p?.isOkxWallet && !p?.isRabby,
            ],
            () => ((aggregator as any)?.isMetaMask ? aggregator : null)
          );
          if (!ethereumProvider) {
            throw new Error('MetaMask not detected. Please install MetaMask and refresh.');
          }
        } else if (providerType === 'rabby') {
          ethereumProvider = matchProvider(
            [
              (p) => p?.isRabby,
              (p) => (p?.providerInfo?.name || '').toLowerCase().includes('rabby'),
              (p) => (p?.providerInfo?.rdns || '').toLowerCase().includes('rabby'),
              (p) => Boolean(p?.rabby),
            ],
            () => (window as any)?.rabby?.ethereum || (window as any)?.rabby || null
          );
          if (!ethereumProvider) {
            throw new Error('Rabby Wallet not detected. Please install the Rabby extension.');
          }
        } else if (providerType === 'okx') {
          ethereumProvider = matchProvider(
            [
              (p) => p?.isOkxWallet,
              (p) => (p?.providerInfo?.name || '').toLowerCase().includes('okx'),
              (p) => (p?.providerInfo?.rdns || '').toLowerCase().includes('okex'),
            ],
            () => (window as any)?.okxwallet?.ethereum || (window as any)?.okxwallet || null
          );
          if (!ethereumProvider) {
            throw new Error('OKX Wallet extension not detected.');
          }
        } else if (providerType === 'coinbase') {
          ethereumProvider = matchProvider(
            [
              (p) => p?.isCoinbaseWallet,
              (p) => (p?.providerInfo?.name || '').toLowerCase().includes('coinbase'),
              (p) => (p?.providerInfo?.rdns || '').toLowerCase().includes('coinbase'),
            ],
            () => window.coinbaseWalletExtension ?? null
          );
          if (!ethereumProvider) {
            throw new Error('Coinbase Wallet extension not detected.');
          }
        } else if (providerType === 'walletconnect') {
          if (!projectId) {
            throw new Error('WalletConnect project ID missing. Set VITE_WALLETCONNECT_PROJECT_ID in your environment.');
          }

          if (!walletConnectModalRef.current) {
            walletConnectModalRef.current = new Web3Modal({
              projectId,
              walletConnectVersion: 2,
              standaloneChains: [`eip155:${Number(BASE_SEPOLIA_CHAIN_ID)}`],
              themeMode: 'dark',
            });
          }

          const wcProvider = await EthereumProvider.init({
            projectId,
            showQrModal: false,
            chains: [Number(BASE_SEPOLIA_CHAIN_ID)],
            optionalChains: [Number(BASE_SEPOLIA_CHAIN_ID)],
            metadata: {
              name: 'MYrAD',
              description: 'MYrAD Data Marketplace',
              url: window.location.origin,
              icons: ['https://pbs.twimg.com/profile_images/1977080620548255745/uoo-Vir5_400x400.jpg'],
            },
          });

          const handleDisplayUri = (uri: string) => {
            walletConnectModalRef.current?.openModal({ uri });
          };

          wcProvider.on('display_uri', handleDisplayUri);

          await wcProvider.enable();
          walletConnectModalRef.current?.closeModal();
          wcProvider.removeListener('display_uri', handleDisplayUri);
          ethereumProvider = wcProvider;
          walletConnectRef.current = wcProvider;
        } else {
          throw new Error('Unsupported wallet type selected.');
        }

        if (providerType !== 'walletconnect') {
          walletConnectRef.current = null;
        }

        if (aggregator && typeof (aggregator as any).setSelectedProvider === 'function' && providerList.includes(ethereumProvider)) {
          try {
            await (aggregator as any).setSelectedProvider(ethereumProvider);
          } catch (setErr) {
            console.warn('Failed to set selected provider on aggregator:', setErr);
          }
        }

        await requestAccounts(ethereumProvider);

        const switched = await switchToBaseSepolia(ethereumProvider);
        if (!switched) {
          setStatus('❌ Failed to switch to Base Sepolia. Please switch manually in your wallet.');
          return;
        }

        const provider = new ethers.BrowserProvider(ethereumProvider);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const isCorrectNetwork = await checkNetwork(provider);
        if (!isCorrectNetwork) {
          setStatus('❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)');
          return;
        }

        try {
          await ensureSignature(signer, userAddress);
        } catch (error: any) {
          console.error('Signature error:', error);
          setStatus(error?.message ?? 'Signature declined. Sign in is required to continue.');
          localStorage.setItem('wallet-disconnected', 'true');
          clearState();
          return;
        }

        console.log('✅ Setting web3 state for address:', userAddress);
        setWeb3State({
          provider,
          signer,
          userAddress,
          connected: true,
        });
        localStorage.removeItem('wallet-disconnected');
        setStatus(`✅ Wallet connected: ${userAddress} (Base Sepolia testnet)`);
        console.log('✅ Web3 state updated successfully');

        // Clear connecting flag after a short delay to ensure state is settled
        setTimeout(() => {
          isConnectingRef.current = false;
          console.log('🔓 Connection process complete, re-enabling accountsChanged listener');
        }, 1000);
      } catch (err: any) {
        console.error('Connect error', err);
        setStatus(`❌ Connect failed: ${err?.message ?? err}`);
        isConnectingRef.current = false;
      }
    },
    [clearState, ensureSignature]
  );

  const disconnectWallet = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.ethereum && window.ethereum.disconnect) {
        await window.ethereum.disconnect();
      }
      if (walletConnectRef.current && typeof walletConnectRef.current.disconnect === 'function') {
        await walletConnectRef.current.disconnect();
      }
      walletConnectModalRef.current?.closeModal?.();
    } catch (err) {
      console.error('Disconnect error:', err);
    } finally {
      walletConnectRef.current = null;
      if (web3State.userAddress) {
        localStorage.removeItem(buildSignatureStorageKey(web3State.userAddress));
      }
      localStorage.setItem('wallet-disconnected', 'true');
      clearState();
      setStatus('');
    }
  }, [clearState, web3State.userAddress]);

  return {
    ...web3State,
    status,
    setStatus,
    connectWallet,
    disconnectWallet,
  };
};