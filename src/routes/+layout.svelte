<script lang="ts">
	import Splashscreens from '$lib/components/splashscreens.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import '../app.pcss';
</script>

<Splashscreens />
<Toaster />
<slot />
