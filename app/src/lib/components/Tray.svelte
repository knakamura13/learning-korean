<script lang="ts">
	import { hasHangul } from '$lib/a11y/lang';

	/** A labelled row of selectable chips — one independent composer slot. */
	let {
		label,
		items,
		selected = null,
		text = false,
		disabled = false,
		tone = 'accent',
		onSelect
	}: {
		label: string;
		items: string[];
		selected?: string | null;
		/** Render as words (ticks, sides) rather than Hangul glyphs. */
		text?: boolean;
		disabled?: boolean;
		tone?: 'accent' | 'blue';
		onSelect: (value: string) => void;
	} = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const picked = $derived(selected != null && selected !== '');
	/** Short tag on the selected chip so duplicate glyphs still name their row. */
	const mark = $derived(slotMark(label));

	function slotMark(name: string): string {
		const head = name.split(/[—]/)[0]?.trim() ?? name;
		const words = head.split(/\s+/).filter(Boolean);
		if (words[0] === 'first' || words[0] === 'second') return words[0];
		return words[0] ?? name;
	}
</script>

<div
	class={['tray', disabled && 'off', picked && 'picked']}
	role="radiogroup"
	aria-labelledby={labelId}
	aria-disabled={disabled ? 'true' : undefined}
>
	<div class="label" id={labelId}>{label}</div>
	<div class="row">
		{#each items as item (item)}
			{@const on = selected === item}
			<button
				type="button"
				class={['chip', text && 'text', on && 'on', tone === 'blue' && 'blue']}
				role="radio"
				aria-checked={on}
				aria-label="{label}: {item}"
				{disabled}
				lang={hasHangul(item) ? 'ko' : undefined}
				onclick={() => onSelect(item)}
			>
				<span class="glyph">{item}</span>
				{#if on}
					<span class="mark">{mark}</span>
				{/if}
			</button>
		{/each}
	</div>
</div>

<style>
	.tray { margin-bottom: var(--s3); }
	.tray.off { opacity: 0.45; }

	.label {
		font-size: 0.62rem;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin-bottom: var(--s1);
		font-weight: 500;
	}

	.tray.picked .label {
		font-weight: 700;
		color: var(--ink);
	}

	.row { display: flex; gap: var(--s2); flex-wrap: wrap; }

	.chip {
		appearance: none;
		border: 1px solid var(--rule-strong);
		background: var(--paper-raised);
		border-radius: var(--r-sm);
		min-width: 3.2rem;
		min-height: 44px;
		padding: 0.45rem 0.55rem;
		font-family: var(--hangul);
		font-size: 1.55rem;
		font-weight: 500;
		line-height: 1.2;
		cursor: pointer;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.08rem;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease), color var(--fast) var(--ease);
	}

	.chip.text {
		font-family: var(--sans);
		font-size: 0.84rem;
		font-weight: 600;
		min-width: 4.4rem;
		min-height: 44px;
		padding: 0.62rem 0.7rem;
	}

	.chip:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
	.chip:active:not(:disabled) { transform: translateY(0); }
	.chip:disabled { cursor: default; opacity: 0.5; }

	.chip.on {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
		border-width: 2px;
	}
	.chip.on.blue { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); }

	.mark {
		font-family: var(--sans);
		font-size: 0.52rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		line-height: 1;
	}

	@media (forced-colors: active) {
		.chip {
			background: ButtonFace;
			color: ButtonText;
			border: 1px solid ButtonText;
		}
		.chip.on,
		.chip.on.blue {
			background: Highlight;
			color: HighlightText;
			border-color: Highlight;
		}
	}
</style>
