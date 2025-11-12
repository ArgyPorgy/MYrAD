import { ethers } from 'ethers';

export interface Dataset {
  symbol: string;
  name: string;
  cid: string;
  marketplace?: string;
  marketplace_address?: string;
  bonding_curve?: string;
  tokenAddress?: string;
  token_address?: string;
  creator?: string;
  total_supply?: number;
  description?: string;
  created_at?: number;
}

export interface DatasetsMap {
  [tokenAddress: string]: Dataset;
}

export interface Web3State {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  userAddress: string;
  connected: boolean;
}

export interface UploadResponse {
  success: boolean;
  cid: string;
  filename: string;
  size: number;
  ipfsUrl: string;
  gatewayUrl: string;
}

export interface CreateDatasetResponse {
  success: boolean;
  tokenAddress: string;
  marketplaceAddress: string;
  symbol: string;
  name: string;
  cid: string;
  message: string;
}

export interface AccessResponse {
  user: string;
  symbol: string;
  download: string;
  ts: number;
}

declare global {
  interface Window {
    ethereum?: any;
    coinbaseWalletExtension?: any;
    okxwallet?: any;
    rabby?: any;
    walletConnectProvider?: any;
  }
}

