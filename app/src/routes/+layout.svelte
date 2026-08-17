<script lang="ts">
	import '../app.css';
	import { assets, resolve } from '$app/paths';
	import { page } from '$app/state';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { pageCanonical, siteAsset } from '$lib/site';
	import { progress } from '$lib/stores/progress.svelte';
	import { activeSystem } from '$lib/theme/active';

	let { children } = $props();

	const canonical = $derived(pageCanonical(page.url.pathname));
	const ogImage = $derived(siteAsset('/og.png'));

	const nav = [
		{ href: '/', label: 'Labs' },
		{ href: '/review', label: 'Review' },
		{ href: '/reference', label: 'Reference' }
	] as const;

	const queue = $derived(progress.stats.queue);
</script>

<svelte:head>
	{#each activeSystem.fonts as face (face.file)}
		<link
			rel="preload"
			href="{assets}/fonts/{face.file}"
			as="font"
			type="font/woff2"
			crossorigin="anonymous"
		/>
	{/each}
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Korean — labs and review" />
	<meta property="og:description" content="Interactive labs and spaced repetition for reading Korean." />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Korean — labs and review" />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:image" content={ogImage} />
	{/if}
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="bar">
	<div class="inner">
		<a class="brand" href={resolve('/')}>
			<span class="mark" lang="ko">한</span>
			<span class="name">Korean</span>
		</a>
		<nav aria-label="Main navigation">
			{#each nav as item (item.href)}
				{@const isActive = item.href === '/'
					? page.url.pathname === '/'
					: page.url.pathname.startsWith(item.href)}
				<a
					href={resolve(item.href)}
					class:active={isActive}
					aria-current={isActive ? 'page' : undefined}
				>
					{item.label}
					{#if item.href === '/review' && queue > 0}
						<span class="badge" aria-label="{queue} cards due for review">{queue}</span>
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
		inset-inline-start: -9999px;
		inset-block-start: 0;
		background: var(--accent);
		color: var(--accent-ink);
		padding: var(--s2) var(--s4);
		z-index: 10;
	}
	.skip:focus { inset-inline-start: var(--s3); inset-block-start: var(--s3); }

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

	nav {
		display: flex;
		gap: var(--s2);
		margin-inline-start: auto;
		min-width: 0;
		flex-shrink: 1;
	}

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
		white-space: nowrap;
		transition: background var(--fast) var(--ease), color var(--fast) var(--ease);
	}
	nav a:hover { background: var(--paper-sunk); color: var(--ink); }
	nav a:active { background: var(--rule); color: var(--ink); }
	nav a.active { color: var(--accent); background: var(--accent-soft); }

	.badge {
		font-family: var(--mono);
		font-size: 0.62rem;
		background: var(--rose);
		color: var(--accent-ink);
		border-radius: var(--r-pill);
		padding: 0.05rem 0.36rem;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 40rem) {
		.inner { gap: var(--s2); }
		nav { gap: var(--s1); }
		nav a { padding: 0.35rem 0.5rem; }
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
