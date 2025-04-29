const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { nodePolyfills } = require('vite-plugin-node-polyfills');

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list
      exclude: [
        'fs', // Excludes the polyfill for 'fs'
      ],
      // Whether to polyfill specific globals
      globals: {
        Buffer: true, // Enables the Buffer polyfill
        global: true, // Enables the global polyfill
        process: true, // Enables the process polyfill
      },
    }),
  ],
  resolve: {
    alias: {
      // Add any aliases you need here
      '@': '/src',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks for better caching
          vendor: ['react', 'react-dom', 'react-router-dom'],
          web3: ['ethers'],
        },
      },
    },
  },
})
