import { ethers } from './ethersImport';
import contractAddresses from './contractAddresses.json';
import SocialMediaABI from './abis/SocialMedia.json';

// Core Chain configuration
export const CORE_CHAIN_ID = 1116;
export const CORE_TESTNET_CHAIN_ID = 1115;

export const CORE_CHAIN_CONFIG = {
  chainId: `0x${CORE_CHAIN_ID.toString(16)}`,
  chainName: 'Core Chain',
  nativeCurrency: {
    name: 'CORE',
    symbol: 'CORE',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.coredao.org'],
  blockExplorerUrls: ['https://scan.coredao.org'],
};

export const CORE_TESTNET_CONFIG = {
  chainId: `0x${CORE_TESTNET_CHAIN_ID.toString(16)}`,
  chainName: 'Core Chain Testnet',
  nativeCurrency: {
    name: 'CORE',
    symbol: 'CORE',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.test.btcs.network'],
  blockExplorerUrls: ['https://scan.test.btcs.network'],
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && window.ethereum !== undefined;
};

// Request account access
export const requestAccount = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts[0];
  } catch (error) {
    throw new Error('User denied account access');
  }
};

// Switch to Core Chain
export const switchToCoreChain = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CORE_CHAIN_CONFIG.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [CORE_CHAIN_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Core Chain to MetaMask');
      }
    } else {
      throw new Error('Failed to switch to Core Chain');
    }
  }
};

// Get provider and signer
export const getProviderAndSigner = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  await requestAccount();

  try {
    // Create a BrowserProvider (ethers v6 replacement for Web3Provider)
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    return { provider, signer };
  } catch (error) {
    console.error('Error getting provider and signer:', error);
    throw new Error('Failed to connect to MetaMask. Please try again.');
  }
};

// Get contract instances with improved error handling
export const getSocialMediaContract = async (signer: any) => {
  const socialMediaAddress = contractAddresses.SocialMedia;

  // Create a simplified mock contract for development
  const createMockContract = () => {
    return {
      // Basic mock functions for essential operations
      getTotalPosts: () => ({ toNumber: () => 3 }),
      getPost: (id: number) => ({
        id: { toNumber: () => id },
        creator: '0x1234567890123456789012345678901234567890',
        ipfsHash: 'QmExample123456789',
        timestamp: { toNumber: () => Math.floor(Date.now() / 1000) - 3600 * id },
        likeCount: { toNumber: () => Math.floor(Math.random() * 100) },
        commentCount: { toNumber: () => Math.floor(Math.random() * 20) },
        isActive: true
      }),
      getProfile: (address?: string) => ({
        user: address || '0x1234567890123456789012345678901234567890',
        username: 'DemoUser',
        bio: 'This is a demo profile for testing',
        profilePictureIpfsHash: '',
        followerCount: { toNumber: () => 42 },
        followingCount: { toNumber: () => 21 },
        isActive: true
      }),
      createPost: (ipfsHash: string) => ({
        wait: async () => {
          console.log(`Mock creating post with IPFS hash: ${ipfsHash}`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return {};
        }
      }),
      likePost: (postId: number) => ({
        wait: async () => Promise.resolve({})
      }),
      unlikePost: (postId: number) => ({
        wait: async () => Promise.resolve({})
      }),
      hasLiked: () => Math.random() > 0.5,
      isFollowing: () => Math.random() > 0.5
    };
  };

  // If contract address is not set, use mock contract
  if (!socialMediaAddress || socialMediaAddress === '0x0000000000000000000000000000000000000000') {
    console.warn('SocialMedia contract address is not set. Using mock contract for development.');
    return createMockContract();
  }

  try {
    // Create contract with ethers v6 API
    const contract = new ethers.Contract(socialMediaAddress, SocialMediaABI, signer);
    return contract;
  } catch (error) {
    console.error('Error creating contract:', error);

    if (import.meta.env.DEV) {
      console.warn('Using mock contract in development mode');
      return createMockContract();
    }

    throw new Error('Failed to connect to the blockchain contract');
  }
};

// Listen for account changes
export const listenForAccountChanges = (callback: (accounts: string[]) => void) => {
  if (!isMetaMaskInstalled()) {
    return;
  }

  window.ethereum.on('accountsChanged', callback);

  return () => {
    window.ethereum.removeListener('accountsChanged', callback);
  };
};

// Listen for chain changes
export const listenForChainChanges = (callback: (chainId: string) => void) => {
  if (!isMetaMaskInstalled()) {
    return;
  }

  window.ethereum.on('chainChanged', callback);

  return () => {
    window.ethereum.removeListener('chainChanged', callback);
  };
};
