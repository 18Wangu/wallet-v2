'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { 
  initSignClient, 
  createWeb3Modal, 
  DEFAULT_NAMESPACES
} from '../config/walletconnect';

// Définition des types
type SignClientInstance = InstanceType<typeof SignClient>;
type SessionNamespace = { accounts: string[] };

interface WalletConnectContextProps {
  signClient: SignClientInstance | null;
  web3Modal: WalletConnectModal | null;
  isConnected: boolean;
  address: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  loading: boolean;
}

const WalletConnectContext = createContext<WalletConnectContextProps | null>(null);

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error('useWalletConnect must be used within a WalletConnectProvider');
  }
  return context;
}

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const [signClient, setSignClient] = useState<SignClientInstance | null>(null);
  const [web3Modal, setWeb3Modal] = useState<WalletConnectModal | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);

  // Initialiser le client WalletConnect
  useEffect(() => {
    const init = async () => {
      try {
        // Initialiser le client WalletConnect
        const client = await initSignClient();
        setSignClient(client);
        
        // Créer l'instance WalletConnectModal
        const modal = createWeb3Modal();
        setWeb3Modal(modal);
        
        // Vérifier s'il y a des sessions existantes
        if (client.session && typeof client.session.getAll === 'function') {
          const sessions = client.session.getAll();
          if (sessions.length > 0) {
            // Utiliser la session la plus récente
            const session = sessions[sessions.length - 1];
            setSessionTopic(session.topic);
            
            // Extraire l'adresse de la session
            if (session.namespaces) {
              const accounts = Object.values(session.namespaces as Record<string, SessionNamespace>)
                .flatMap(namespace => namespace.accounts || []);
              
              if (accounts.length > 0) {
                const accountParts = accounts[0].split(':');
                setAddress(accountParts[accountParts.length - 1]);
                setIsConnected(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de WalletConnect:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Configurer les écouteurs d'événements pour le client WalletConnect
  useEffect(() => {
    if (!signClient) return;

    // Écouteur pour les propositions de session
    const handleSessionProposal = async (event: any) => {
      console.log('Session proposal received:', event);
      try {
        // Approuver la session automatiquement
        const { topic, acknowledged } = await signClient.approve({
          id: event.id,
          namespaces: event.params.requiredNamespaces
        });

        // Attendre la confirmation
        await acknowledged();
        
        // Mettre à jour l'état de la connexion
        setSessionTopic(topic);
        setIsConnected(true);
        
        // Récupérer l'adresse du wallet
        if (signClient.session && typeof signClient.session.get === 'function') {
          const session = signClient.session.get(topic);
          if (session.namespaces) {
            const accounts = Object.values(session.namespaces as Record<string, SessionNamespace>)
              .flatMap(namespace => namespace.accounts || []);
            
            if (accounts.length > 0) {
              const accountParts = accounts[0].split(':');
              setAddress(accountParts[accountParts.length - 1]);
            }
          }
        }
        
        // Fermer la modal
        if (web3Modal && typeof web3Modal.closeModal === 'function') {
          web3Modal.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors de l\'approbation de la session:', error);
      }
    };

    // Écouteur pour la suppression de session
    const handleSessionDelete = (event: any) => {
      console.log('Session deleted:', event);
      if (event.topic === sessionTopic) {
        setIsConnected(false);
        setAddress('');
        setSessionTopic(null);
      }
    };

    // Ajouter les écouteurs
    if (typeof signClient.on === 'function') {
      signClient.on('session_proposal', handleSessionProposal);
      signClient.on('session_delete', handleSessionDelete);

      // Nettoyer les écouteurs
      return () => {
        if (typeof signClient.off === 'function') {
          signClient.off('session_proposal', handleSessionProposal);
          signClient.off('session_delete', handleSessionDelete);
        }
      };
    }
    return undefined;
  }, [signClient, sessionTopic, web3Modal]);

  // Fonction pour se connecter
  const connect = async () => {
    if (!signClient || !web3Modal) {
      console.error('WalletConnect n\'est pas initialisé');
      return;
    }

    try {
      // Créer une proposition de session
      if (typeof signClient.connect === 'function') {
        const { uri, approval } = await signClient.connect({
          requiredNamespaces: DEFAULT_NAMESPACES,
          optionalNamespaces: {},
        });

        if (uri && typeof web3Modal.openModal === 'function') {
          // Ouvrir la modal WalletConnect avec l'URI
          web3Modal.openModal({ uri });
          
          // Attendre l'approbation
          const session = await approval();
          console.log('Session established:', session);
          // La mise à jour de l'état sera gérée par l'écouteur d'événements
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      if (web3Modal && typeof web3Modal.closeModal === 'function') {
        web3Modal.closeModal();
      }
    }
  };

  // Fonction pour se déconnecter
  const disconnect = async () => {
    if (!signClient || !sessionTopic) return;

    try {
      if (typeof signClient.disconnect === 'function') {
        await signClient.disconnect({
          topic: sessionTopic,
          reason: { code: 6000, message: 'User disconnected' },
        });
      }
      
      setIsConnected(false);
      setAddress('');
      setSessionTopic(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const value = {
    signClient,
    web3Modal,
    isConnected,
    address,
    connect,
    disconnect,
    loading
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
}
