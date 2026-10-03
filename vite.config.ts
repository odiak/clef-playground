import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  server: {
    // スマホ実機での確認用に cloudflared のクイックトンネル経由のアクセスを許可する
    allowedHosts: [".trycloudflare.com"],
  },
});
