import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        products: resolve(__dirname, 'products.html'),
        vestuario: resolve(__dirname, 'vestuario.html'),
        admin: resolve(__dirname, 'admin.html'),
        fidelidade: resolve(__dirname, 'fidelidade.html')
      }
    }
  }
});
