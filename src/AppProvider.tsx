// @noErrors: 2307 2580 2339 - cannot find 'process', cannot find './wagmi', cannot find 'import.meta'
'use client';

import type { ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'wagmi/chains';

export function Providers(props: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey="u3g7Ugay57Csl2CjBB5MKJ9HgHrwnbdC"
      chain={base} // add baseSepolia for testing
    >
      {props.children}
    </OnchainKitProvider>
  );
}