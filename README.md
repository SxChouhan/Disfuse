# Disfuse

A decentralized social media platform built on CoreDAO (Core Chain), inspired by Instagram but with full Web3 integration, decentralized data storage, and blockchain-based interactions.

## Features

- **Web3 Integration**: Login via decentralized wallets (MetaMask, Core Wallet)
- **Decentralized Storage**: Content stored on IPFS via Web3.storage with hashes saved on CoreDAO
- **Social Features**: Create posts, like, comment, follow, and direct messaging
- **Custom Design**: Dark-mode interface with neon accents
- **Monetization**: Tip creators in $CORE tokens and stake for content curation

## Tech Stack

- **Frontend**: React.js + TypeScript, Tailwind CSS
- **Smart Contracts**: Solidity on CoreDAO
- **Storage**: IPFS for decentralized content storage
- **Authentication**: Sign-In with Ethereum (SIWE)
- **Backend**: Minimal Node.js/Express for API routing

## Getting Started

### Prerequisites

- Node.js (v16+)
- MetaMask or Core Wallet browser extension
- Core Chain RPC endpoint

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/Disfuse.git
   cd Disfuse
   ```

#### Smart Contracts Setup

1. Navigate to the contracts directory:
   ```
   cd contracts
   ```

2. Install dependencies:
   ```
   npm install
   npm install @openzeppelin/contracts dotenv
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file with your private key and RPC URLs.

5. Compile the contracts:
   ```
   npx hardhat compile
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install required TypeScript type definitions:
   ```
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

4. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

5. Edit the `.env` file with your Web3.storage token and contract addresses.

6. Start the development server:
   ```
   npm run dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

## Smart Contract Deployment

1. Configure your `.env` file with your private key and Core Chain RPC URL
2. Deploy the contracts to Core Chain
   ```
   npx hardhat run scripts/deploy.js --network core
   ```

## IPFS Storage Setup

This project uses IPFS for decentralized storage via Pinata. To set up IPFS storage:

1. Create an account at Pinata.cloud
2. Generate an API token from your account dashboard
3. Add the token to your frontend `.env` file as `VITE_WEB3_STORAGE_TOKEN`

The IPFS utility in `frontend/src/utils/ipfs.ts` handles:
- Uploading files to IPFS
- Uploading JSON data to IPFS
- Uploading post content and images
- Uploading user profile information
- Retrieving data from IPFS

## License

MIT

## DEployed Contract
0x6eC270221117B53597aA603b3AC66904Cf2A0187

![Transaction](https://github.com/user-attachments/assets/9e6c1906-e98d-4ff1-a32d-0264768b5a9a)

