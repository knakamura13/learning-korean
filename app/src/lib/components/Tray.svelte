<script lang="ts">
	/** A labelled row of selectable chips — the input for every composer step. */
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
</script>

<div class="tray" class:off={disabled}>
	<div class="label">{label}</div>
	<div class="row">
		{#each items as item (item)}
			<button
				class="chip"
				class:text
				class:on={selected === item}
				class:blue={tone === 'blue'}
				{disabled}
				onclick={() => onSelect(item)}
			>{item}</button>
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
	}

	.row { display: flex; gap: var(--s2); flex-wrap: wrap; }

	.chip {
		appearance: none;
		border: 1px solid var(--rule-strong);
		background: var(--paper-raised);
		border-radius: var(--r-sm);
		min-width: 3.2rem;
		padding: 0.45rem 0.55rem;
		font-family: var(--hangul);
		font-size: 1.55rem;
		font-weight: 500;
		line-height: 1.2;
		cursor: pointer;
		transition: border-color var(--fast) var(--ease), background var(--fast) var(--ease),
			transform var(--fast) var(--ease), color var(--fast) var(--ease);
	}

	.chip.text {
		font-family: var(--sans);
		font-size: 0.84rem;
		font-weight: 600;
		min-width: 4.4rem;
		padding: 0.62rem 0.7rem;
	}

	.chip:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
	.chip:disabled { cursor: default; opacity: 0.5; }

	.chip.on {
		border-color: var(--accent);
		background: var(--accent-soft);
		color: var(--accent);
	}
	.chip.on.blue { border-color: var(--blue); background: var(--blue-soft); color: var(--blue); }
</style>
