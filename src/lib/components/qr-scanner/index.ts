import { writable } from 'svelte/store';

export { default as QrScanner } from './qr-scanner.svelte';

export const scannerRunning = writable(false);
