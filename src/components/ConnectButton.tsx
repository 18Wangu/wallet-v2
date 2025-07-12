'use client';

import { useWalletConnect } from './WalletConnectContext';

export default function ConnectButton() {
  const { isConnected, address, connect, disconnect, loading } = useWalletConnect();

  if (loading) {
    return <button className="p-2 bg-gray-300 rounded-lg" disabled>Chargement...</button>;
  }

  if (isConnected) {
    return (
      <div className="p-4 border rounded-lg shadow-md">
        <p className="font-bold mb-2">Connecté : {address.substring(0, 6)}...{address.substring(address.length - 4)}</p>
        <button 
          onClick={disconnect}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Déconnecter
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={connect}
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
    >
      Connecter Wallet
    </button>
  );
}
