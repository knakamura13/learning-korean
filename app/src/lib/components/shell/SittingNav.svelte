<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { attachModalDialog, requestModalClose } from '$lib/a11y/attachModalDialog';

	let {
		items,
		sitting,
		reviewAria
	}: {
		items: readonly { href: '/' | '/review' | '/drill' | '/reference'; label: string }[];
		sitting: number;
		reviewAria: string;
	} = $props();

	let open = $state(false);
	let sheetEl = $state<HTMLDialogElement | null>(null);

	function isActive(href: string): boolean {
		return href === '/'
			? page.url.pathname === '/' || page.url.pathname.startsWith('/lab/')
			: page.url.pathname.startsWith(href);
	}

	function attachSheet(node: HTMLDialogElement) {
		sheetEl = node;
		const stop = attachModalDialog(node, () => (open = false));
		return () => {
			sheetEl = null;
			stop();
		};
	}

	function closeSheet() {
		if (sheetEl) requestModalClose(sheetEl, () => (open = false));
		else open = false;
	}
</script>

<div class="sitting-nav">
	<button
		type="button"
		class="trigger"
		aria-label="Main navigation"
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={() => (open = true)}
	>
		<span class="label">Labs</span>
		<svg class="chev" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
			<path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.5" />
		</svg>
		{#if sitting > 0}
			<span class="badge" aria-hidden="true"></span>
		{/if}
	</button>

	{#if open}
		<dialog
			class="sitting-sheet"
			aria-labelledby="sitting-nav-heading"
			{@attach attachSheet}
		>
			<h2 id="sitting-nav-heading">Main navigation</h2>
			<nav>
				<ul>
					{#each items as item (item.href)}
						<li>
							<a
								href={resolve(item.href)}
								aria-current={isActive(item.href) ? 'page' : undefined}
								aria-label={item.href === '/review' && sitting > 0 ? reviewAria : undefined}
								onclick={closeSheet}
							>
								{item.label}
								{#if item.href === '/review' && sitting > 0}
									<span class="count">{sitting}</span>
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
			<button type="button" class="btn ghost close" onclick={closeSheet}>Close</button>
		</dialog>
	{/if}
</div>

<style>
	.sitting-nav {
		display: none;
		flex-shrink: 0;
	}
	@media (max-width: 40rem) {
		.sitting-nav {
			display: block;
		}
	}

	.trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s1);
		min-width: 44px;
		min-height: 44px;
		padding: 0 var(--s2);
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--accent);
		font: inherit;
		font-size: 0.84rem;
		cursor: pointer;
	}
	.trigger:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.label { font-weight: 500; }
	.chev {
		inline-size: 12px;
		block-size: 12px;
	}

	.badge {
		position: absolute;
		inset-inline-end: 0.15rem;
		inset-block-start: 0.2rem;
		inline-size: 8px;
		block-size: 8px;
		border-radius: 50%;
		background: var(--rose);
	}

	.sitting-sheet {
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
	.sitting-sheet::backdrop {
		background: color-mix(in srgb, var(--ink) 35%, transparent);
	}
	.sitting-sheet h2 {
		margin: 0 0 var(--s3);
		font-family: var(--display);
		font-style: italic;
		font-size: 1.1rem;
		font-weight: 400;
	}
	.sitting-sheet ul {
		list-style: none;
		margin: 0 0 var(--s3);
		padding: 0;
	}
	.sitting-sheet a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 44px;
		padding: var(--s1) var(--s2);
		border-radius: var(--r-sm);
		text-decoration: none;
		color: var(--ink);
		font-size: 0.87rem;
	}
	.sitting-sheet a[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.count {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
	}
	.close { min-height: 44px; }

	@media (prefers-reduced-motion: reduce) {
		.trigger { transition: none; }
	}

	@media (forced-colors: active) {
		.trigger { color: ButtonText; }
		.sitting-sheet {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
		.sitting-sheet a[aria-current='page'] {
			background: Highlight;
			color: HighlightText;
		}
		.badge { background: Highlight; }
	}
</style>
