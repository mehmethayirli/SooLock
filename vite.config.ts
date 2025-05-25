import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import polyfillNode from "rollup-plugin-polyfill-node";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

export default defineConfig({
  plugins: [
    react()
  ],
  define: {
    // process.env hatası için boş obje
    "process.env": {},
    // globalThis polyfill
    global: "globalThis"
  },
  server: {
    cors: true,
    port: 5173
  },
  resolve: {
    alias: {
      // Node core modüllerinin browser polyfill’leri
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      https: "agent-base",
      url: "url",
      zlib: "browserify-zlib",
      vm: "vm-browserify"
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // globalThis’in esbuild aşamasında tanınması için
      define: {
        global: "globalThis"
      },
      // Node.js core polyfill’leri
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background.js"),
        content: resolve(__dirname, "src/contentScript.js")
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background" || chunkInfo.name === "content"
            ? "[name].js"
            : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      },
      // Build aşamasında Node polyfill’lerini ekle
      plugins: [
        polyfillNode()
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    outDir: "extension"
  }
});
