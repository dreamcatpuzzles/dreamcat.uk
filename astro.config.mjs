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
        },
        {
            provider: fontProviders.local(),
            name: 'MatchaWorld',
            cssVariable: '--font-matcha-world',
            options: {
                variants: [{
                    src: ['src/fonts/Matcha-World.woff'],
                    weight: 'normal',
                    style: 'normal'
                }]
            }
        },
        {
            provider: fontProviders.local(),
            name: 'Nougat',
            cssVariable: '--font-nougat',
            options: {
                variants: [{
                    src: ['src/fonts/Nougat-ExtraBlack.woff'],
                    weight: 'normal',
                    style: 'normal'
                }]
            }
        }
    ],
    integrations: [react()],
});
