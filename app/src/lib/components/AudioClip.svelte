<script lang="ts">
	let { jamo, opus, mp3 }: { jamo: string; opus: string; mp3: string } = $props();

	let failed = $state(false);
	let playing = $state(false);
	let audio: HTMLAudioElement | undefined;

	function clip(node: HTMLAudioElement) {
		audio = node;
		return () => {
			node.pause();
			audio = undefined;
		};
	}

	async function toggle() {
		if (!audio || failed) return;
		if (playing) {
			audio.pause();
			playing = false;
			return;
		}
		try {
			audio.currentTime = 0;
			await audio.play();
			playing = true;
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
			failed = true;
			playing = false;
		}
	}

	function markFailed() {
		failed = true;
		playing = false;
	}
</script>

<button
	type="button"
	class="play"
	class:failed
	aria-disabled={failed}
	aria-label={failed ? `Couldn't play ${jamo}` : playing ? `Pause ${jamo}` : `Play ${jamo}`}
	aria-pressed={playing}
	onclick={toggle}
>
	{#if playing}
		<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
			<rect x="6" y="5" width="4.5" height="14" rx="1" fill="currentColor" />
			<rect x="13.5" y="5" width="4.5" height="14" rx="1" fill="currentColor" />
		</svg>
	{:else}
		<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
			<path d="M8 5.5v13l11-6.5z" fill="currentColor" />
		</svg>
	{/if}
</button>
<audio
	{@attach clip}
	preload="none"
	onended={() => (playing = false)}
	onerror={markFailed}
	onpause={() => (playing = false)}
>
	<source src={opus} type="audio/opus" />
	<source src={mp3} type="audio/mpeg" />
</audio>

<style>
	.play {
		display: inline-flex;
		appearance: none;
		align-items: center;
		justify-content: center;
		width: 44px;
		min-width: 44px;
		min-height: 44px;
		padding: 0;
		border: 1px solid var(--rule);
		border-radius: var(--r-sm);
		background: var(--paper-sunk);
		color: var(--accent);
		cursor: pointer;
		flex-shrink: 0;
		transition:
			background var(--fast) var(--ease),
			color var(--fast) var(--ease);
	}
	.play:hover {
		background: var(--paper-raised);
		color: var(--ink);
	}
	.play:active {
		background: color-mix(in srgb, var(--ink) 6%, var(--paper-sunk));
		transform: translateY(1px);
	}
	.play:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.play[aria-pressed='true'] {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.play[aria-disabled='true'] {
		cursor: not-allowed;
		color: var(--ink-faint);
		background: var(--paper-sunk);
		border-color: var(--rule);
	}
	.play[aria-disabled='true']:hover,
	.play[aria-disabled='true']:active {
		background: var(--paper-sunk);
		color: var(--ink-faint);
		transform: none;
	}

	.ico {
		width: 1.05rem;
		height: 1.05rem;
		display: block;
	}

	@media (forced-colors: active) {
		.play {
			background: Canvas;
			border: 1px solid ButtonBorder;
			color: ButtonText;
		}
		.play:focus-visible {
			outline: 2px solid Highlight;
			box-shadow: none;
		}
		.play[aria-disabled='true'] {
			color: GrayText;
			border-color: GrayText;
		}
	}
</style>
