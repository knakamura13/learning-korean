<script lang="ts">
	import Target from '../Target.svelte';
	import { derive, derivations } from '$lib/domain/hangul';
	import type { BuildStep } from '$lib/content/types';
	import { fly } from 'svelte/transition';
	import { untrack } from 'svelte';

	let { step, onSettle, onNudge }: {
		step: BuildStep;
		onSettle: (teach?: string) => void;
		onNudge: (html: string, soft?: boolean) => void;
	} = $props();

	// Captured once on purpose: the runner remounts this component per step,
	// so the starting letter should not react to later prop changes.
	let path = $state<string[]>(untrack(() => [step.start]));
	let ops = $state<string[]>([]);
	let solved = $state(false);

	const current = $derived(path[path.length - 1]);
	const won = $derived(current === step.target);
	const canStroke = $derived(!won && !!derive(current, 'stroke'));
	const canDouble = $derived(!won && !!derive(current, 'double'));
	const deadEnd = $derived(!won && derivations(current).length === 0);

	$effect(() => {
		if (won && !solved) {
			solved = true;
			onSettle();
		} else if (deadEnd && !solved) {
			onNudge(
				step.miss ??
					`<p>Dead end — <span class="jamo">${current}</span> has no further derivations. Undo and try the other operation.</p>`
			);
		}
	});

	function apply(op: 'stroke' | 'double') {
		const next = derive(current, op);
		if (!next || solved) return;
		path = [...path, next];
		ops = [...ops, op === 'stroke' ? '+' : '×2'];
	}

	function undo() {
		if (path.length < 2 || solved) return;
		path = path.slice(0, -1);
		ops = ops.slice(0, -1);
	}
</script>

<Target target={step.target} name={step.targetName} />

<div class="chain">
	{#each path as glyph, i (i + glyph)}
		{#if i > 0}<span class="op">{ops[i - 1]}</span>{/if}
		<span
			class="link"
			class:cur={i === path.length - 1}
			class:win={i === path.length - 1 && won}
			in:fly={{ y: 8, duration: 220 }}
		>{glyph}</span>
	{/each}
</div>

<div class="tools">
	<button class="tool" disabled={!canStroke} onclick={() => apply('stroke')}>+ stroke</button>
	<button class="tool" disabled={!canDouble} onclick={() => apply('double')}>× double</button>
	<button class="tool undo" disabled={path.length < 2 || won} onclick={undo}>undo</button>
</div>

<style>
	.chain {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--s2);
		flex-wrap: wrap;
		min-height: 5rem;
		padding: var(--s2) 0 var(--s4);
	}

	.link {
		font-family: var(--hangul);
		font-size: 3rem;
		font-weight: 500;
		line-height: 1;
		color: var(--ink-faint);
		transition: color var(--med) var(--ease), font-size var(--med) var(--ease);
	}
	.link.cur { color: var(--ink); font-size: 4.2rem; }
	.link.win { color: var(--good); }

	.op {
		font-family: var(--mono);
		font-size: 0.68rem;
		color: var(--accent);
		padding-bottom: 0.9rem;
	}

	.tools { display: flex; gap: var(--s2); justify-content: center; flex-wrap: wrap; }

	.tool {
		appearance: none;
		border: 1px solid var(--accent);
		background: var(--paper-raised);
		color: var(--accent);
		border-radius: var(--r-pill);
		padding: 0.5rem 1.2rem;
		min-height: 44px;
		font-size: 0.84rem;
		font-weight: 600;
		cursor: pointer;
		transition: background var(--fast) var(--ease), transform var(--fast) var(--ease);
	}
	.tool:hover:not(:disabled) { background: var(--accent-soft); transform: translateY(-1px); }
	.tool:disabled { opacity: 0.32; cursor: default; border-color: var(--rule); color: var(--ink-faint); }
	.tool.undo { border-color: var(--rule-strong); color: var(--ink-soft); }
	.tool.undo:hover:not(:disabled) { background: var(--paper-sunk); }

	@media (forced-colors: active) {
		.tool,
		.tool.undo {
			background: ButtonFace;
			color: ButtonText;
			border-color: ButtonText;
		}
		.tool:disabled {
			color: GrayText;
			border-color: GrayText;
			opacity: 1;
		}
	}
</style>
