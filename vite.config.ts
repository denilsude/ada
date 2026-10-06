import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { ponteLocal } from "./servidor/ponte";

const POLITICA_SEGURANCA = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'self' ipc: http://ipc.localhost http://127.0.0.1:47831",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

function politicaDeSeguranca(): Plugin {
  return {
    name: "ada-politica-seguranca",
    apply: "build",
    transformIndexHtml: (html) =>
      html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${POLITICA_SEGURANCA}" />\n    <meta name="referrer" content="no-referrer" />`),
  };
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.ico", "favicon-16x16.png", "favicon-32x32.png", "favicon-48x48.png", "apple-touch-icon.png"],
      manifest: {
        name: "ADA",
        short_name: "ADA",
        description: "Sistema pessoal de organização e produtividade.",
        theme_color: "#0e0e10",
        background_color: "#0e0e10",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
    politicaDeSeguranca(),
    ponteLocal(),
  ],
  server: { port: 5420, strictPort: false, host: "localhost" },
  preview: { port: 5421, host: "localhost" },
  build: { chunkSizeWarningLimit: 1500 },
});
