import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
    global: "globalThis",
  },
  server: {
    cors: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background.js"),
        content: resolve(__dirname, "src/contentScript.js"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "background" || chunkInfo.name === "content"
            ? "[name].js"
            : "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
      external: ["https", "zlib", "url", "vm", "crypto", "stream", "buffer"],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    outDir: "extension",
  },
  resolve: {
    alias: {
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      https: "agent-base",
      url: "url",
      zlib: "browserify-zlib",
      vm: "vm-browserify",
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
});
