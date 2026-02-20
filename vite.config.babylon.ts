import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, Plugin } from "vite";
import * as fs from 'fs';
import * as path from 'path';

// Simple plugin to serve index.babylon.html instead of index.html
function serveBabylonHtml(): Plugin {
  return {
    name: 'serve-babylon-html',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url === '/index.html') {
          req.url = '/index.babylon.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [serveBabylonHtml(), react(), tailwindcss()],
  server: {
    port: 5176, // Different port for Babylon test
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.babylon.html',
      },
    },
  },
});
