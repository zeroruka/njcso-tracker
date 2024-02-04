<script lang="ts">
	import Infobox from '$lib/components/infobox.svelte';
	import { QrScanner } from '$lib/components/qr-scanner';
	import { Button } from '$lib/components/ui/button';
	import type { InstrumentData } from '$lib/server/sheets';
	import { stateMachine } from '$lib/state';
	import { cn, flyAndScale } from '$lib/utils';
	import { useMachine } from '@xstate/svelte';
	import { gsap } from 'gsap';
	import { Flip } from 'gsap/all';
	import { Camera } from 'radix-icons-svelte';
	import { getContext, onMount, setContext } from 'svelte';
	import { toast } from 'svelte-sonner';

	let cameraPermission: PermissionStatus;
	let message = 'Scan any tag code';
	let prevDecodedText = '';

	setContext('stateMachine', useMachine(stateMachine) as any);

	const { snapshot, send } = getContext('stateMachine') as any;
	// $: console.log('State', $snapshot.value, $snapshot);

	let instrumentData: InstrumentData;

	async function onSuccess(decodedText: string, decodedResult: any) {
		// Prevent duplicate scans
		if (decodedText === prevDecodedText) return;
		prevDecodedText = decodedText;
		send({ type: 'loading' });

		switch ($snapshot.context.loop) {
			case 0:
				const rsp = await fetch(`?query=${decodedText}`);
				if (!rsp.ok) {
					send({ type: 'failure' });
					toast.error('Invalid instrument code', {
						duration: 1200,
						classes: {
							toast: 'group-[.toaster]:left-[20%]'
						}
					});
					break;
				}
				instrumentData = await rsp.json();
				send({ type: 'success' });
				break;
			case 1:
				if (decodedText !== instrumentData.zone) {
					send({ type: 'failure' });
					toast.error('Invalid zone', {
						duration: 1200,
						classes: {
							toast: 'group-[.toaster]:left-[29%]'
						}
					});
					break;
				}
				await updateValues();
				send({ type: 'success' });
				break;
		}
	}

	onMount(async () => {
		gsap.registerPlugin(Flip);
		startScanner();
	});

	$: $snapshot.matches('enabled') && changeMessage();

	function changeMessage() {
		if ($snapshot.context.loop === 0) message = 'Scan instrument tag';
		if ($snapshot.context.loop === 1) message = `Scan zone ${instrumentData.zone} QR code`;
	}

	async function startScanner() {
		const permissionStatus = await navigator.permissions.query({
			name: 'camera' as PermissionName
		});
		cameraPermission = permissionStatus;
		if (cameraPermission.state === 'granted') {
			send({ type: 'start' });
		}
	}

	async function updateValues() {
		await fetch('?', {
			method: 'PATCH',
			body: JSON.stringify({
				values: {
					location: instrumentData.location === 'SR' ? 'Home' : 'SR'
				},
				id: instrumentData.id
			})
		});
	}
</script>

<div class="h-full bg-[url(background.png)] bg-cover bg-center bg-no-repeat">
	{#if cameraPermission && cameraPermission.state === 'prompt'}
		<button
			transition:flyAndScale={{ duration: 300 }}
			on:click={async () => {
				await navigator.mediaDevices.getUserMedia({ video: true });
				startScanner();
			}}
			class="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4 backdrop-brightness-95"
		>
			<Camera class="h-16 w-16 drop-shadow-md" />
			<p class="inline-block max-w-xs text-center text-lg font-medium drop-shadow-md">
				Camera access is required for scanning QR codes, press anywhere to request access.
			</p>
		</button>
	{/if}

	<div
		class={cn(
			'fixed inset-0 z-40 transition-all duration-500',
			$snapshot.matches('end')
				? 'bg-background/70 backdrop-blur-xl'
				: 'bg-background/0 backdrop-blur-0'
		)}
	/>

	<!-- <div
		class="fixed top-0 z-50"
		style="padding: env(safe-area-inset-top) 0 0 env(safe-area-inset-left);"
	>
		<Button on:click={() => onSuccess('c610dc3b', '')}>instrum</Button>
		<Button on:click={() => onSuccess('D', '')}>zone</Button>
		<Button on:click={() => updateValues()}>update</Button>
	</div> -->
	<Infobox bind:instrumentData />
	<QrScanner {onSuccess}>
		<div
			transition:flyAndScale={{ duration: 300 }}
			class="absolute left-1/2 top-28 z-50 -translate-x-1/2 -translate-y-1/2 transform rounded-2xl bg-background/70 p-3 font-semibold drop-shadow-md backdrop-blur-xl"
			style="margin: env(safe-area-inset-top) 0 0 env(safe-area-inset-left);"
		>
			{message}
		</div>
	</QrScanner>
</div>
