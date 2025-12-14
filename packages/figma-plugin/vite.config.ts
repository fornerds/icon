import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        code: resolve(__dirname, 'src/code.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});

