<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { progress } from '$lib/stores/progress.svelte';

	let { children } = $props();

	const nav = [
		{ href: '/', label: 'Labs' },
		{ href: '/review', label: 'Review' },
		{ href: '/reference', label: 'Reference' }
	];

	const queue = $derived(progress.stats.queue);
</script>

<a class="skip" href="#main">Skip to content</a>

<header class="bar">
	<div class="inner">
		<a class="brand" href="/">
			<span class="mark" lang="ko">한</span>
			<span class="name">Korean</span>
		</a>
		<nav>
			{#each nav as item (item.href)}
				<a
					href={item.href}
					class:active={item.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(item.href)}
				>
					{item.label}
					{#if item.href === '/review' && queue > 0}
						<span class="badge">{queue}</span>
					{/if}
				</a>
			{/each}
		</nav>
		<ThemeToggle />
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<style>
	.skip {
		position: absolute;
		left: -9999px;
		top: 0;
		background: var(--accent);
		color: var(--accent-ink);
		padding: var(--s2) var(--s4);
		z-index: 10;
	}
	.skip:focus { left: var(--s3); top: var(--s3); }

	.bar {
		position: sticky;
		top: 0;
		z-index: 5;
		padding-top: env(safe-area-inset-top);
		background: color-mix(in srgb, var(--paper) 88%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--rule);
	}

	.inner {
		max-width: var(--shell);
		margin: 0 auto;
		padding-block: var(--s2);
		padding-inline: max(var(--s5), env(safe-area-inset-left)) max(var(--s5), env(safe-area-inset-right));
		display: flex;
		align-items: center;
		gap: var(--s5);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--s2);
		text-decoration: none;
		color: var(--ink);
		font-weight: 600;
	}

	.mark {
		font-family: var(--hangul);
		font-size: 1.4rem;
		color: var(--accent);
		line-height: 1;
	}

	.name { font-size: 0.9rem; letter-spacing: 0.01em; }

	nav { display: flex; gap: var(--s2); margin-left: auto; }

	nav a {
		display: inline-flex;
		align-items: center;
		gap: var(--s1);
		min-height: 44px;
		padding: 0.35rem 0.7rem;
		border-radius: var(--r-sm);
		font-size: 0.84rem;
		text-decoration: none;
		color: var(--ink-soft);
		transition: background var(--fast) var(--ease), color var(--fast) var(--ease);
	}
	nav a:hover { background: var(--paper-sunk); color: var(--ink); }
	nav a.active { color: var(--accent); background: var(--accent-soft); }

	.badge {
		font-family: var(--mono);
		font-size: 0.62rem;
		background: var(--accent);
		color: var(--accent-ink);
		border-radius: var(--r-pill);
		padding: 0.05rem 0.36rem;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 30rem) {
		.inner {
			padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
			gap: var(--s2);
		}
		.name { display: none; }
	}

	@media (forced-colors: active) {
		.bar {
			background: Canvas;
			color: CanvasText;
			border-bottom: 1px solid ButtonBorder;
			backdrop-filter: none;
		}
		.badge {
			background: Highlight;
			color: HighlightText;
		}
		nav a.active {
			background: Highlight;
			color: HighlightText;
		}
	}
</style>
