<script lang="ts">
	import Splashscreens from '$lib/components/splashscreens.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import '../app.pcss';

	onMount(async () => {
		if (pwaInfo) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<Splashscreens />
<Toaster />
<slot />
