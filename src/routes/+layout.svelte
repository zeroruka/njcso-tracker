<script lang="ts">
	import { dev } from '$app/environment';
	import Splashscreens from '$lib/components/splashscreens.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import '../app.pcss';

	inject({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();
</script>

<Splashscreens />
<Toaster />
<slot />
