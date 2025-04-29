// This file handles the ethers.js import to avoid Vite import issues
import * as ethersLib from 'ethers';

// Mock implementation for development when ethers fails to load
export const mockEthers = {
  providers: {
    Web3Provider: class MockWeb3Provider {
      constructor() {
        // Mock implementation
      }
      getSigner() {
        return {
          getAddress: async () => '0x1234567890123456789012345678901234567890',
          signMessage: async () => '0xmocksignature',
        };
      }
    },
    JsonRpcProvider: class MockJsonRpcProvider {
      constructor() {
        // Mock implementation
      }
    },
  },
  Contract: class MockContract {
    constructor() {
      // Mock implementation
    }
  },
  utils: {
    formatEther: (value: any) => '0.0',
    parseEther: (value: string) => ({ _hex: '0x0' }),
  },
};

// Create a variable to hold the actual ethers export
let ethersExport = ethersLib;

// Test if ethers is working properly
try {
  // Simple test to see if basic functionality works
  if (typeof ethersLib.Contract !== 'function') {
    throw new Error('ethers.Contract is not a function');
  }
} catch (error) {
  console.warn('Ethers.js failed to load properly, using mock implementation');
  // Use mock implementation instead
  ethersExport = mockEthers;
}

// Export the working implementation
export const ethers = ethersExport;
