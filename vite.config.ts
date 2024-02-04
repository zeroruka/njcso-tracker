import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
	plugins: [
		mkcert(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifestFilename: 'site.webmanifest'
		})
	]
});
