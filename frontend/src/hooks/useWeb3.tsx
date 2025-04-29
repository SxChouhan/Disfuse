import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from '../utils/ethersImport';
import {
  requestAccount,
  getProviderAndSigner,
  getSocialMediaContract,
  switchToCoreChain,
  listenForAccountChanges,
  listenForChainChanges,
  CORE_CHAIN_ID,
  isMetaMaskInstalled
} from '../utils/web3';

interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isCorrectChain: boolean;
  socialMediaContract: any; // Using any for contract to avoid ethers version issues
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
  error: string | null;
  isMetaMaskInstalled: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  isConnected: false,
  isCorrectChain: false,
  socialMediaContract: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  loading: false,
  error: null,
  isMetaMaskInstalled: false,
});

export const useWeb3 = () => useContext(Web3Context);

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [socialMediaContract, setSocialMediaContract] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metamaskInstalled, setMetamaskInstalled] = useState<boolean>(false);

  const isConnected = !!account;
  const isCorrectChain = chainId === `0x${CORE_CHAIN_ID.toString(16)}`;

  // Check if MetaMask is installed
  useEffect(() => {
    setMetamaskInstalled(isMetaMaskInstalled());
  }, []);

  // Initialize wallet connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (isMetaMaskInstalled()) {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });

          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            setAccount(address);

            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(chainIdHex);

            if (address) {
              try {
                const { signer } = await getProviderAndSigner();
                const contract = await getSocialMediaContract(signer);
                setSocialMediaContract(contract);
              } catch (err) {
                console.error('Failed to get contract:', err);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to check wallet connection:', err);
      }
    };

    checkConnection();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const accountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        setAccount(null);
        setSocialMediaContract(null);
      } else {
        setAccount(accounts[0]);
        // Update contract with new signer
        getProviderAndSigner().then(({ signer }) => {
          getSocialMediaContract(signer).then(contract => {
            setSocialMediaContract(contract);
          }).catch(console.error);
        }).catch(console.error);
      }
    };

    const chainChanged = (newChainId: string) => {
      setChainId(newChainId);
      // Reload only if we were previously connected to the correct chain
      if (isCorrectChain) {
        window.location.reload();
      } else {
        // Just update the chain ID
        setChainId(newChainId);
      }
    };

    const unsubscribeAccounts = listenForAccountChanges(accountsChanged);
    const unsubscribeChain = listenForChainChanges(chainChanged);

    return () => {
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeChain) unsubscribeChain();
    };
  }, [isCorrectChain]);

  // Connect wallet
  const connectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
      }

      const address = await requestAccount();
      setAccount(address);

      try {
        await switchToCoreChain();
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(chainIdHex);
      } catch (err) {
        console.error('Failed to switch chain:', err);
        // Continue anyway, we'll show a warning in the UI
      }

      try {
        const { signer } = await getProviderAndSigner();
        const contract = await getSocialMediaContract(signer);
        setSocialMediaContract(contract);
      } catch (err) {
        console.error('Failed to get contract:', err);
        throw new Error('Failed to connect to the blockchain. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet (for UI purposes only, doesn't actually disconnect MetaMask)
  const disconnectWallet = () => {
    setAccount(null);
    setSocialMediaContract(null);
  };

  const value = {
    account,
    isConnected,
    isCorrectChain,
    socialMediaContract,
    connectWallet,
    disconnectWallet,
    loading,
    error,
    isMetaMaskInstalled: metamaskInstalled,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
