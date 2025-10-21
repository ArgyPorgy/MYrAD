import { ethers } from 'ethers';
import { BASE_SEPOLIA_CHAIN_ID_HEX, BASE_SEPOLIA_CHAIN_ID } from '@/constants/contracts';

export const shortenAddress = (addr: string): string => {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
};

export const switchToBaseSepolia = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchErr: any) {
    if (switchErr.code === 4902) {
      alert("Please add Base Sepolia testnet to MetaMask and switch to it");
      return false;
    }
    if (switchErr.code !== 4001) {
      console.error("Network switch error:", switchErr);
    }
    return false;
  }
};

export const checkNetwork = async (provider: ethers.BrowserProvider): Promise<boolean> => {
  const network = await provider.getNetwork();
  return network.chainId === BASE_SEPOLIA_CHAIN_ID;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Retry wrapper for contract calls that may fail due to RPC issues
 * Retries up to 3 times with exponential backoff
 */
export async function retryContractCall<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      const isRpcError = error?.code === 'UNKNOWN_ERROR' || 
                         error?.code === 'NETWORK_ERROR' ||
                         error?.code === 'TIMEOUT' ||
                         error?.data?.httpStatus === 408 ||
                         error?.message?.includes('timeout') ||
                         error?.message?.includes('RPC');
      
      if (isLastAttempt || !isRpcError) {
        throw error;
      }
      
      console.warn(`RPC call failed (attempt ${i + 1}/${retries}), retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
  
  throw new Error('Retry limit exceeded');
}

