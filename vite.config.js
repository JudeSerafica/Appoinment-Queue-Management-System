import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    // Absolute asset paths so deep links like /dashboard/queue load correctly
    base: '/',
    server: {
        port: 3000,
        open: true
    }
});
