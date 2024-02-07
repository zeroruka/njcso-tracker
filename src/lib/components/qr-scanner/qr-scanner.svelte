<script lang="ts">
	import { cn } from '$lib/utils';
	import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import ViewportIndicator from './viewport-indicator.svelte';

	export let onSuccess: (decodedText: string, decodedResult: any) => void;
	export let onError: (error: any) => void = () => {};

	let { snapshot, send } = getContext('stateMachine') as any;

	let className: string = '';
	let reader: HTMLElement;
	export { className as class };

	let html5QrCode: Html5Qrcode;

	const dispatch = createEventDispatcher();

	const config = {
		fps: 20, // frame per seconds for qr code scanning
		qrbox: { width: 250, height: 250 },
		videoConstraints: {
			facingMode: 'environment',
			aspectRatio: window.outerHeight / window.outerWidth
		}
	};

	async function startScan() {
		if (!reader) return;
		console.log('starting', html5QrCode.getState());
		switch (html5QrCode.getState()) {
			case Html5QrcodeScannerState.NOT_STARTED:
				html5QrCode
					.start({ facingMode: 'environment' }, config, onSuccess, onError)
					.then(async () => {
						dispatch('scannerReady');
						await new Promise((resolve) => setTimeout(resolve, 1000));
						send({ type: 'ready' });
					});
				break;
			case Html5QrcodeScannerState.PAUSED:
				html5QrCode.resume();
				send({ type: 'ready' });
				break;
			case Html5QrcodeScannerState.SCANNING:
				send({ type: 'ready' });
				break;
			case Html5QrcodeScannerState.UNKNOWN:
				break;
		}
	}
	function stopScan() {
		if (html5QrCode?.getState() === Html5QrcodeScannerState.SCANNING) {
			html5QrCode.stop();
		}
	}

	function pauseScan() {
		if (html5QrCode?.getState() === Html5QrcodeScannerState.SCANNING) {
			html5QrCode.pause();
		}
	}

	$: $snapshot.matches('enabled') && startScan();
	$: $snapshot.matches('disabled') && stopScan();
	$: $snapshot.matches('loading') && pauseScan();
	$: $snapshot.matches('end') && pauseScan();

	onMount(() => {
		html5QrCode = new Html5Qrcode('reader', {
			formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
			verbose: false
		});
	});
</script>

<div
	id="reader"
	class={cn('relative min-h-full -translate-y-[var(--sat)]', className)}
	bind:this={reader}
	transition:fade={{ duration: 300, delay: 300 }}
>
	{#if $snapshot.matches('scanning')}
		<slot />
		<ViewportIndicator />
	{/if}
</div>

<style>
	:global(#reader > #qr-shaded-region) {
		display: none;
	}
</style>
