import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    plugins: [react()],

    server: {
      host: "0.0.0.0",
      port: 3001,

      // nur für production domain nötig
      allowedHosts: isDev ? true : ["www.auzora.de", "auzora.de"],

      // proxy nur in dev!
      ...(isDev && {
        proxy: {
          "/api": {
            target: "http://localhost:8080",
            changeOrigin: true,
          },
        },
      }),
    },
  };
});
