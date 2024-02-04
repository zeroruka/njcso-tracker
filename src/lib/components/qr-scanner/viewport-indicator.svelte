<script lang="ts">
	import { fade } from 'svelte/transition';
</script>

<div
	class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform"
	style="padding: env(safe-area-inset-top) 0 0 env(safe-area-inset-left);"
	id="viewport-indicator"
	transition:fade={{ duration: 150 }}
>
	<img src="scanner.svg" alt="" class="h-[250px] w-[250px] max-w-none" draggable={false} />
</div>

<style>
	@keyframes bounce {
		0%,
		100% {
			transform: scale(0.95);
			animation-timing-function: ease-in;
		}
		50% {
			transform: scale(1);
			animation-timing-function: ease-out;
		}
	}
	#viewport-indicator img {
		animation: bounce 1s infinite;
	}
</style>
