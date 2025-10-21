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

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!window.ethereum) return;

      // Check if user has manually disconnected
      const userDisconnected = localStorage.getItem('wallet-disconnected');
      if (userDisconnected === 'true') {
        return; // Don't auto-reconnect if user manually disconnected
      }

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
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
            setStatus(`✅ Wallet connected: ${userAddress} (Base Sepolia testnet)`);
          } else {
            setStatus("❌ Wrong network! Please switch to Base Sepolia testnet (chainId: 84532)");
          }
        }
      } catch (err) {
        console.error("Check existing connection error:", err);
      }
    };

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

      // Check for specific wallet providers
      if (providerType === 'coinbase' && window.coinbaseWalletExtension) {
        ethereumProvider = window.coinbaseWalletExtension;
      } else if (providerType === 'walletconnect') {
        // For WalletConnect, we'd need to implement the WalletConnect provider
        // For now, fall back to MetaMask
        if (!window.ethereum) {
          throw new Error("WalletConnect not implemented yet. Please use MetaMask.");
        }
      } else if (!window.ethereum) {
        throw new Error("No wallet provider found. Please install MetaMask or Coinbase Wallet.");
      }

      const provider = new ethers.BrowserProvider(ethereumProvider);
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
      // Try to disconnect from the wallet provider if it supports it
      if (window.ethereum && window.ethereum.disconnect) {
        await window.ethereum.disconnect();
      }
      
      // Mark as manually disconnected in localStorage
      localStorage.setItem('wallet-disconnected', 'true');
      
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

