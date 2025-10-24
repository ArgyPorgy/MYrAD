import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={import.meta.env.VITE_COINBASE_API_KEY}
      chain={base} // add baseSepolia for testing
    >
      {props.children}
    </OnchainKitProvider>
  );
}