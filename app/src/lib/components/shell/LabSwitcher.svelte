<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { attachModalDialog, requestModalClose } from '$lib/a11y/attachModalDialog';
	import { LABS } from '$lib/content';
	import { courseNavView, requiredLab, toCourseLab } from '$lib/domain/courseNav';
	import { labPreviewModels } from '$lib/domain/labPreview';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	let { currentId }: { currentId: string } = $props();

	const course = LABS.map(toCourseLab);
	const standfirsts = Object.fromEntries(LABS.map((lab) => [lab.id, lab.standfirst]));

	let ready = $state(false);
	let open = $state(false);
	let sheetEl = $state<HTMLDialogElement | null>(null);

	onMount(() => {
		ready = true;
	});

	const navView = $derived.by(() =>
		courseNavView({
			ready,
			labs: course,
			isUnlocked: (tier) => progress.isUnlocked(tier),
			isOpened: (id) => progress.isOpened(id),
			sessionFor: (id) => labSession.all[id]
		})
	);

	const items = $derived(
		labPreviewModels(course, standfirsts, navView, (requires) => requiredLab(course, requires))
	);
	const current = $derived(items.find((item) => item.id === currentId) ?? items[0]);

	function attachSheet(node: HTMLDialogElement) {
		sheetEl = node;
		const stopModal = attachModalDialog(node, () => (open = false));
		return () => {
			sheetEl = null;
			stopModal();
		};
	}

	function closeSheet() {
		if (sheetEl) requestModalClose(sheetEl, () => (open = false));
		else open = false;
	}
</script>

<!-- Phone/tablet stand-in for the ≥72rem lab index rail: same models, one tap. -->
<div class="switcher">
	<button
		type="button"
		class="trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={() => (open = true)}
	>
		<span class="num">{current.numberLabel}</span>
		<span class="title">{current.title}</span>
		<svg class="chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
			<path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" />
		</svg>
	</button>

	{#if open}
		<dialog
			class="sheet"
			aria-labelledby="lab-switcher-heading"
			{@attach attachSheet}
		>
			<h2 id="lab-switcher-heading">Labs</h2>
			<ol>
				{#each items as item (item.id)}
					<li>
						<a
							href={resolve('/lab/[id]', { id: item.id })}
							aria-current={item.id === currentId ? 'page' : undefined}
							aria-label={item.accessibleName}
							data-kind={item.chipKind}
							onclick={() => (open = false)}
						>
							<span class="num">{item.numberLabel}</span>
							<span class="row-title">{item.title}</span>
							{#if item.chipKind === 'done'}
								<span class="chip done" aria-hidden="true">done</span>
							{:else if item.chip}
								<span class="chip {item.chipKind}" aria-hidden="true">{item.chip}</span>
							{/if}
						</a>
					</li>
				{/each}
			</ol>
			<button type="button" class="btn ghost close" onclick={closeSheet}>Close</button>
		</dialog>
	{/if}
</div>

<style>
	/* The vertical index rail owns ≥72rem; this switcher owns everything below. */
	@media (min-width: 72rem) {
		.switcher {
			display: none;
		}
	}

	.switcher {
		margin-block-end: var(--s3);
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		max-width: 100%;
		padding: var(--s1) var(--s3);
		font: inherit;
		font-size: 0.84rem;
		color: var(--ink-soft);
		background: var(--paper-raised);
		border: 1px solid var(--rule);
		border-radius: var(--r-pill);
		cursor: pointer;
		transition: color var(--fast) var(--ease), border-color var(--fast) var(--ease);
	}
	.trigger:hover {
		color: var(--ink);
		border-color: var(--rule-strong);
	}
	.trigger:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.trigger .title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chev {
		inline-size: 12px;
		block-size: 12px;
		flex-shrink: 0;
	}

	.num {
		font-family: var(--mono);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		color: var(--ink-faint);
		flex-shrink: 0;
	}

	.sheet {
		width: min(26rem, calc(100% - 2rem));
		max-height: min(70dvh, 34rem);
		padding: var(--s4);
		border: 1px solid var(--rule);
		border-radius: var(--r-lg);
		background: var(--paper-raised);
		color: var(--ink);
		box-shadow: var(--shadow-3);
		overscroll-behavior: contain;
	}
	.sheet::backdrop {
		background: color-mix(in srgb, var(--ink) 35%, transparent);
	}

	.sheet h2 {
		margin: 0 0 var(--s3);
		font-family: var(--display);
		font-style: italic;
		font-size: 1.1rem;
		font-weight: 400;
	}

	.sheet ol {
		list-style: none;
		margin: 0 0 var(--s3);
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.sheet a {
		display: flex;
		align-items: center;
		gap: var(--s2);
		min-height: 44px;
		padding: var(--s1) var(--s2);
		border-radius: var(--r-sm);
		text-decoration: none;
		color: var(--ink);
		font-size: 0.87rem;
	}
	.sheet a:hover {
		background: var(--paper-sunk);
	}
	.sheet a:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}
	.sheet a[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.sheet a[data-kind='locked'] {
		color: var(--ink-faint);
	}

	.row-title {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chip {
		flex-shrink: 0;
		font-size: 0.75rem;
		line-height: 1;
		padding: 0.25rem 0.5rem;
		border-radius: var(--r-pill);
		white-space: nowrap;
	}
	.chip.done {
		color: var(--good);
		background: var(--good-soft);
	}
	.chip.resume {
		color: var(--blue);
		background: var(--blue-soft);
	}
	.chip.start {
		color: var(--accent);
		background: var(--accent-soft);
	}
	.chip.locked {
		color: var(--ink-faint);
		background: var(--paper-sunk);
	}

	.close {
		min-height: 44px;
	}

	@media (prefers-reduced-motion: reduce) {
		.trigger {
			transition: none;
		}
	}

	@media (forced-colors: active) {
		.trigger,
		.sheet {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.sheet a[aria-current='page'] {
			background: Highlight;
			color: HighlightText;
		}
		.chip {
			border: 1px solid ButtonBorder;
		}
	}
</style>
