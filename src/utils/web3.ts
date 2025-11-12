import { ethers } from 'ethers';
import { BASE_SEPOLIA_CHAIN_ID_HEX, BASE_SEPOLIA_CHAIN_ID } from '@/constants/contracts';

const PUBLIC_RPC_URL =
  import.meta.env?.VITE_BASE_RPC_URL || 'https://sepolia.base.org';

const publicRpcProvider = new ethers.JsonRpcProvider(PUBLIC_RPC_URL);

export const getPublicRpcProvider = () => publicRpcProvider;

export const shortenAddress = (addr: string): string => {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
};

export const switchToBaseSepolia = async (provider?: any): Promise<boolean> => {
  const ethProvider = provider || window.ethereum;
  if (!ethProvider) return false;

  try {
    await ethProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchErr: any) {
    // Handle both standard error code 4902 and Rabby's -32603 with "Unrecognized chain" message
    const needsToAddChain = 
      switchErr.code === 4902 || 
      (switchErr.code === -32603 && switchErr.message?.includes('Unrecognized chain')) ||
      switchErr.message?.includes('wallet_addEthereumChain');
    
    if (needsToAddChain) {
      try {
        console.log('🔗 Chain not found, attempting to add Base Sepolia...');
        await ethProvider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
              chainName: 'Base Sepolia',
              rpcUrls: [PUBLIC_RPC_URL],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            },
          ],
        });
        console.log('✅ Base Sepolia chain added successfully');
        
        // After adding, try switching again
        try {
          await ethProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
          });
          console.log('✅ Switched to Base Sepolia');
          return true;
        } catch (secondSwitchErr: any) {
          if (secondSwitchErr.code !== 4001) {
            console.error("Failed to switch after adding chain:", secondSwitchErr);
          }
          return false;
        }
      } catch (addErr: any) {
        if (addErr.code !== 4001) {
          console.error("Failed to add Base Sepolia network:", addErr);
        }
        return false;
      }
    }
    
    // User rejected or other error
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

