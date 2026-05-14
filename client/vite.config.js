import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        proxy: {
            "/socket.io": {target: `${import.meta.env.VITE_BACKEND_URL}`, ws: true},
        },
    },
});
