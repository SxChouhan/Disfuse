import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../hooks/useWeb3';

const Navigation: React.FC = () => {
  const { account, isConnected, connectWallet, disconnectWallet, loading, error, isCorrectChain, isMetaMaskInstalled } = useWeb3();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-darkSecondary p-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-neonGreen">Disfuse</Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMobileMenu}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-4">
          {isConnected ? (
            <>
              {!isCorrectChain && (
                <div className="text-red-500 text-sm">
                  Please switch to Core Chain
                </div>
              )}

              <Link to="/create" className="btn-primary">
                Create Post
              </Link>

              <div className="relative group">
                <Link to="/profile" className="btn-secondary">
                  {formatAddress(account || '')}
                </Link>

                <div className="absolute right-0 mt-2 w-48 bg-darkSecondary rounded-md shadow-lg py-1 hidden group-hover:block z-20">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-white hover:bg-gray-700">
                    My Profile
                  </Link>
                  <button
                    onClick={disconnectWallet}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {!isMetaMaskInstalled ? (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Install MetaMask
                </a>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="btn-secondary"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 bg-darkSecondary rounded-lg shadow-lg p-4">
          {isConnected ? (
            <div className="flex flex-col space-y-3">
              {!isCorrectChain && (
                <div className="text-red-500 text-sm">
                  Please switch to Core Chain
                </div>
              )}

              <Link
                to="/create"
                className="btn-primary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Post
              </Link>

              <Link
                to="/profile"
                className="btn-secondary text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {formatAddress(account || '')}
              </Link>

              <button
                onClick={() => {
                  disconnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="btn-secondary bg-red-600 hover:bg-red-700 border-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {!isMetaMaskInstalled ? (
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-center"
                >
                  Install MetaMask
                </a>
              ) : (
                <button
                  onClick={() => {
                    connectWallet();
                    setMobileMenuOpen(false);
                  }}
                  disabled={loading}
                  className="btn-secondary w-full"
                >
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white p-2 text-center text-sm mt-2">
          {error}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
