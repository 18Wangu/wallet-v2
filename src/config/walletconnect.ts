import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';

// Configuration pour WalletConnect
export const WALLET_CONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || '';

// Vérification du Project ID
if (!WALLET_CONNECT_PROJECT_ID) {
  console.error(
    "⚠️ WalletConnect Project ID manquant! \n" +
    "Veuillez créer un fichier .env.local à la racine du projet avec NEXT_PUBLIC_PROJECT_ID=votre_project_id \n" +
    "Vous pouvez obtenir un Project ID sur https://cloud.walletconnect.com"
  );
}

// Namespaces requis pour la connexion
export const DEFAULT_NAMESPACES = {
  eip155: {
    methods: [
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sign',
      'personal_sign',
      'eth_signTypedData'
    ],
    chains: ['eip155:1', 'eip155:56', 'eip155:137'],
    events: ['chainChanged', 'accountsChanged']
  }
};

// Métadonnées de l'application
export const APP_METADATA = {
  name: 'Parc des Princes',
  description: 'Connectez-vous avec Socios',
  url: 'https://socios.com',
  icons: ['https://socios.com/favicon.ico']
};

// Initialisation du client WalletConnect
export async function initSignClient() {
  try {
    const client = await SignClient.init({
      projectId: WALLET_CONNECT_PROJECT_ID,
      metadata: APP_METADATA
    });
    
    return client;
  } catch (error) {
    console.error('Error initializing WalletConnect client:', error);
    throw error;
  }
}

// Création d'une instance WalletConnectModal
export function createWeb3Modal() {
  return new WalletConnectModal({
    projectId: WALLET_CONNECT_PROJECT_ID,
    explorerRecommendedWalletIds: [
      '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f' // ID de Socios.com
    ],
    themeMode: 'dark'
  });
}
