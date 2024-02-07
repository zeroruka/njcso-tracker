<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn, flyAndScale } from '$lib/utils';
	import { Flip } from 'gsap/all';
	import { Check, DoorClosed, DoorOpen, Loader2, MoreHorizontal, X } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { fade } from 'svelte/transition';

	export let instrumentData: InstrumentData | undefined;

	let container: HTMLDivElement;

	const { snapshot, send } = getContext('stateMachine') as any;

	function animateInfoBox() {
		const state = Flip.getState(container);
		container.style.width = window.innerWidth - 32 + 'px';
		Flip.from(state, {
			duration: 0.45,
			absolute: true,
			ease: 'power3.out'
		});
	}

	function resetState() {
		send({ type: 'reset' });
		instrumentData = undefined;
	}

	$: $snapshot.matches('success') && animateInfoBox();
</script>

{#if $snapshot.matches('end') && instrumentData}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4 p-4">
		<span>
			{#if instrumentData.location === 'SR'}
				<DoorOpen class="h-16 w-16 " />
			{:else}
				<DoorClosed class="h-16 w-16" />
			{/if}
		</span>
		<div class="flex flex-col items-center justify-center">
			<p class="inline-block max-w-xs text-center text-lg font-medium">
				{instrumentData.instrument}
				{instrumentData.location === 'SR' ? 'checked out' : 'checked in'} successfully
			</p>
			<span class=" text-muted-foreground">
				{new Date().toLocaleString()}
			</span>
		</div>
		<Button
			variant="ghost"
			class="rounded-full bg-background/70 transition-transform focus-visible:scale-95"
			on:click={() => resetState()}>Scan another</Button
		>
	</div>
{/if}

{#if $snapshot.matches('loading') || instrumentData || $snapshot.matches('error')}
	<div
		class="fixed inset-x-0 bottom-0 z-50 flex justify-center"
		transition:flyAndScale={{ duration: 500 }}
	>
		<div
			class="m-2 my-4 flex h-20 w-20 space-x-2 overflow-hidden rounded-[40px] bg-background/70 p-2 backdrop-blur-xl"
			bind:this={container}
		>
			<div class={cn('flex h-16 w-16 items-center justify-center rounded-full bg-background/70')}>
				{#if $snapshot.matches('loading')}
					<div in:fade={{ duration: 100, delay: 100 }}>
						<Loader2 class="h-8 w-8 animate-spin" />
					</div>
				{:else if $snapshot.matches('end')}
					<div in:fade={{ duration: 100, delay: 100 }}>
						<Check class="h-8 w-8 " />
					</div>
				{:else if $snapshot.matches('error')}
					<div in:fade={{ duration: 100, delay: 100 }}>
						<X class="h-8 w-8 text-red-400" />
					</div>
				{:else if $snapshot.matches('success') || instrumentData}
					<div in:fade={{ duration: 100, delay: 100 }}>
						<MoreHorizontal class="h-8 w-8 animate-pulse" />
					</div>
				{/if}
			</div>
			{#if instrumentData}
				<div class="flex flex-shrink-0 flex-col" in:fade={{ delay: 100, duration: 200 }}>
					<span class="text-3xl font-semibold">
						{instrumentData.instrument}
					</span>

					<p class="text-md text-muted-foreground">
						{instrumentData.status === 'Loaned'
							? `Loaned by ${instrumentData.loaned_by}`
							: 'Not loaned out'}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
