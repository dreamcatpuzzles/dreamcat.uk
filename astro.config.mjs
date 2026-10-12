// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
    output: 'static',
    vite: {
        plugins: [tailwindcss()],
    },
    fonts: [
        {
            provider: fontProviders.fontsource(),
            name: 'Nunito',
            cssVariable: '--font-nunito',
            weights: ["400 700"]
            
        }
    ],
    integrations: [react()],
});
