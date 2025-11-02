import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Web3State } from '@/types/web3';
import { switchToBaseSepolia, checkNetwork } from '@/utils/web3';

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    userAddress: '',
    connected: false,
  });
  const [status, setStatus] = useState<string>('');

  // Listen for account and chain changes
  // Auto-reconnect on page reload if wallet is still connected (but don't show selector if already connected)
  useEffect(() => {
    // Check if wallet is already connected on page load (reload scenario)
    const checkExistingConnection = async () => {
      // If user manually disconnected, don't auto-reconnect
      if (localStorage.getItem('wallet-disconnected') === 'true') {
        console.log('Wallet was manually disconnected - not auto-reconnecting');
        return;
      }

      if (!window.ethereum) return;

      try {
        // Try to get accounts without requesting (if already connected, this works)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        
        if (accounts && accounts.length > 0) {
          // Wallet is already connected - restore connection
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          
          const isCorrectNetwork = await checkNetwork(provider);
          if (isCorrectNetwork) {
            setWeb3State({
              provider,
              signer,
              userAddress,
              connected: true,
            });
            setStatus(`✅ Wallet connected: ${userAddress} (Base Sepolia testnet)`);
            console.log('✅ Auto-reconnected to existing wallet connection');
          } else {
            setStatus("❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)");
          }
        }
      } catch (err) {
        // Wallet not connected or error - that's fine, user will connect manually
        console.log('No existing wallet connection found');
      }
    };

    // Check for existing connection on mount
    checkExistingConnection();

    // Listen for account changes
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setWeb3State({
          provider: null,
          signer: null,
          userAddress: '',
          connected: false,
        });
        setStatus('');
      } else {
        // User switched accounts
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          
          const isCorrectNetwork = await checkNetwork(provider);
          if (isCorrectNetwork) {
            setWeb3State({
              provider,
              signer,
              userAddress,
              connected: true,
            });
            // Clear disconnect flag since user switched accounts (still connected)
            localStorage.removeItem('wallet-disconnected');
            setStatus(`✅ Wallet connected: ${userAddress} (Base Sepolia testnet)`);
          } else {
            setStatus("❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)");
          }
        } catch (err) {
          console.error("Account change error:", err);
          setStatus("❌ Account change failed: " + (err as any)?.message);
        }
      }
    };

      // Listen for chain changes
      const handleChainChanged = async () => {
        if (web3State.connected) {
          const isCorrectNetwork = await checkNetwork(web3State.provider!);
          if (isCorrectNetwork) {
            setStatus(`✅ Wallet connected: ${web3State.userAddress} (Base Sepolia testnet)`);
          } else {
            setStatus("❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)");
          }
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
  }, []);

  const connectWallet = useCallback(async (providerType: string = 'metamask') => {
    try {
      let ethereumProvider = window.ethereum;

      // CRITICAL: Find and use MetaMask's provider aggregator when multiple wallets are installed
      // When MetaMask + OKX (or other wallets) are both installed:
      // - MetaMask creates an aggregator at window.ethereum that has a .providers property
      // - The aggregator shows a wallet selector UI when you request permissions
      // - If OKX overrides window.ethereum, we need to find the aggregator differently
      
      if (window.ethereum) {
        const providers = (window.ethereum as any).providers;
        
        // Check if window.ethereum itself is MetaMask's aggregator (has providers array)
        if (providers && Array.isArray(providers) && providers.length > 1) {
          // ✅ This IS MetaMask's aggregator - use it (will show selector)
          ethereumProvider = window.ethereum;
          console.log(`✅ Using MetaMask aggregator (${providers.length} wallets detected). Selector will appear.`);
        } 
        // Check if window.ethereum is MetaMask itself (single provider, but is MetaMask)
        else if ((window.ethereum as any).isMetaMask) {
          // This is MetaMask directly (only one wallet installed)
          ethereumProvider = window.ethereum;
          console.log('Using MetaMask provider directly.');
        }
        // OKX or other wallet might have overridden window.ethereum
        else {
          // Try to find MetaMask's aggregator even when OKX overrides window.ethereum
          // MetaMask's aggregator might be accessible through:
          // 1. window.ethereum.providers[0] (if MetaMask is first provider)
          // 2. Or we'll use wallet_requestPermissions which should trigger selector
          
          if (providers && Array.isArray(providers) && providers.length > 0) {
            // Providers array exists but only one - might be MetaMask or aggregator
            // Try to find MetaMask in the array
            const metamaskProvider = providers.find((p: any) => p?.isMetaMask);
            if (metamaskProvider) {
              // Found MetaMask - but we want the aggregator, not individual provider
              // The aggregator is usually at window.ethereum itself when it has providers
              // Since OKX overrode it, we might need to reconstruct or use requestPermissions
              console.log('MetaMask found in providers but window.ethereum overridden. Using requestPermissions to trigger selector.');
              ethereumProvider = window.ethereum; // Will use requestPermissions below
            } else {
              ethereumProvider = window.ethereum;
            }
          } else {
            // No providers array - OKX or other wallet overrode window.ethereum
            // We'll rely on wallet_requestPermissions to show selector
            ethereumProvider = window.ethereum;
            console.log('⚠️ No providers array detected. Using wallet_requestPermissions to trigger selector.');
          }
        }
      }

      // Check for specific wallet providers (if explicitly requested)
      if (providerType === 'coinbase' && window.coinbaseWalletExtension) {
        ethereumProvider = window.coinbaseWalletExtension;
      } else if (providerType === 'walletconnect') {
        if (!window.ethereum) {
          throw new Error("WalletConnect not implemented yet. Please use MetaMask.");
        }
      } else if (!window.ethereum) {
        throw new Error("No wallet provider found. Please install MetaMask or Coinbase Wallet.");
      }

      // IMPORTANT: Use the provider we selected (MetaMask aggregator if available)
      const provider = new ethers.BrowserProvider(ethereumProvider);
      
      // CRITICAL: Use wallet_requestPermissions on the SELECTED provider to trigger wallet selector
      // If we found MetaMask's aggregator (has .providers array), this will show the selector
      // If OKX overrode window.ethereum, we're using OKX and it might not show selector
      try {
        // Request permissions on the provider - MetaMask aggregator will show selector
        await ethereumProvider.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        console.log('✅ Permissions requested - selector should have appeared if multiple wallets');
      } catch (permError: any) {
        // If wallet_requestPermissions is not supported or user denies, fall back to eth_requestAccounts
        // Error code 4001 means user rejected, which is fine
        if (permError.code !== 4001) {
          console.log('wallet_requestPermissions not supported, using eth_requestAccounts');
          await provider.send("eth_requestAccounts", []);
        } else {
          throw permError; // User rejected, re-throw
        }
      }
      
      // Ensure accounts are available after permission request
      await provider.send("eth_requestAccounts", []);

      // Force switch to Base Sepolia testnet
      const switched = await switchToBaseSepolia();
      if (!switched) {
        return;
      }

      // Reinitialize provider after network switch
      const newProvider = new ethers.BrowserProvider(ethereumProvider);
      const signer = await newProvider.getSigner();
      const userAddress = await signer.getAddress();

      const isCorrectNetwork = await checkNetwork(newProvider);
      if (!isCorrectNetwork) {
        setStatus("❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)");
        return;
      }

      setWeb3State({
        provider: newProvider,
        signer,
        userAddress,
        connected: true,
      });

      // Clear disconnect flag since user is connecting
      localStorage.removeItem('wallet-disconnected');

      setStatus(`✅ Wallet connected: ${userAddress} (Base Sepolia testnet)`);
    } catch (err: any) {
      console.error("Connect error", err);
      setStatus("❌ Connect failed: " + (err.message || err));
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      // Try to revoke permissions (EIP-2255) to actually disconnect from wallet
      if (window.ethereum) {
        try {
          // Get current permissions
          const permissions = await window.ethereum.request({
            method: 'wallet_getPermissions'
          });
          
          // Revoke all permissions - pass the permission objects directly
          if (permissions && permissions.length > 0) {
            // For each permission, revoke it
            for (const permission of permissions) {
              try {
                await window.ethereum.request({
                  method: 'wallet_revokePermissions',
                  params: [permission]
                });
              } catch (revokeError) {
                // If individual revoke fails, try with just the parentCapability
                try {
                  await window.ethereum.request({
                    method: 'wallet_revokePermissions',
                    params: [{ parentCapability: permission.parentCapability }]
                  });
                } catch (e) {
                  console.log('Alternative revoke method also failed');
                }
              }
            }
          }
        } catch (permissionError) {
          // If wallet_revokePermissions fails, try alternative methods
          console.log('Permission revocation method not supported, trying alternative...');
          
          // Some wallets might support disconnect method
          if (typeof (window.ethereum as any).disconnect === 'function') {
            await (window.ethereum as any).disconnect();
          }
          
          // For wallets that support close() method
          if (typeof (window.ethereum as any).close === 'function') {
            await (window.ethereum as any).close();
          }
        }
      }
      
      // Mark as manually disconnected in localStorage
      localStorage.setItem('wallet-disconnected', 'true');
      
      // CRITICAL: Clear wallet selection cache to force selector on next connection
      // When multiple wallets are installed, we need to reset the cached selection
      if (window.ethereum) {
        try {
          // Check if there are multiple providers (multiple wallets installed)
          const hasMultipleProviders = (window.ethereum as any).providers && 
                                      Array.isArray((window.ethereum as any).providers) && 
                                      (window.ethereum as any).providers.length > 1;
          
          if (hasMultipleProviders) {
            // Multiple wallets detected - clear any cached selection
            // The next eth_requestAccounts should trigger the wallet selector
            console.log('Multiple wallets detected - selector will appear on next connection');
          }
          
          // Request accounts to reset any internal state
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length === 0) {
            console.log('✅ Successfully disconnected from wallet');
          }
        } catch (e) {
          // Ignore errors here
        }
      }
      
      // Clear frontend state
      setWeb3State({
        provider: null,
        signer: null,
        userAddress: '',
        connected: false,
      });
      setStatus('');
    } catch (err) {
      console.error("Disconnect error:", err);
      // Even if wallet disconnect fails, clear frontend state and mark as disconnected
      localStorage.setItem('wallet-disconnected', 'true');
      setWeb3State({
        provider: null,
        signer: null,
        userAddress: '',
        connected: false,
      });
      setStatus('');
    }
  }, []);

  return {
    ...web3State,
    status,
    setStatus,
    connectWallet,
    disconnectWallet,
  };
};

