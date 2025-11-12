import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected({ 
      target: 'metaMask',
      shimDisconnect: false,
    }),
    injected({
      target() {
        return {
          id: 'rabby',
          name: 'Rabby Wallet',
          provider: (window as any)?.rabby,
        };
      },
      shimDisconnect: false,
    }),
    injected({
      target() {
        return {
          id: 'okx',
          name: 'OKX Wallet',
          provider: (window as any)?.okxwallet,
        };
      },
      shimDisconnect: false,
    }),
    coinbaseWallet({
      appName: 'MYrAD',
      appLogoUrl: 'https://pbs.twimg.com/profile_images/1977080620548255745/uoo-Vir5_400x400.jpg',
    }),
    walletConnect({
      projectId,
      metadata: {
        name: 'MYrAD',
        description: 'MYrAD Data Marketplace',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['https://pbs.twimg.com/profile_images/1977080620548255745/uoo-Vir5_400x400.jpg'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://sepolia.base.org'),
  },
  ssr: false,
});

