'use client';

import { WalletConnectProvider } from '../components/WalletConnectContext';
import ConnectButton from '../components/ConnectButton';

export default function Home() {
  return (
    <WalletConnectProvider>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-8">WalletConnect v2 Demo</h1>
        <div className="mb-8">
          <ConnectButton />
        </div>
      </div>
    </WalletConnectProvider>
  );
}
