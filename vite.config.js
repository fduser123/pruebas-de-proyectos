import { defineConfig } from 'vite';

const allowedHost = process.env.VITE_ALLOWED_HOST;

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: allowedHost ? [allowedHost, 'localhost', '127.0.0.1'] : ['localhost', '127.0.0.1'],
  },
});
