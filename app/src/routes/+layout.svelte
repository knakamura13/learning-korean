<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { assets, resolve } from '$app/paths';
	import { page } from '$app/state';
	import SettingsLink from '$lib/components/SettingsLink.svelte';
	import { armSkipLanding, disarmSkipLanding } from '$lib/a11y/skipLanding';
	import { OG_IMAGE_ALT, pageCanonical, SITE_DESCRIPTION, siteAsset } from '$lib/site';
	import { progress } from '$lib/stores/progress.svelte';
	import { activeSystem } from '$lib/theme/active';
	import { applyLook, readLookId, readThemePref, subscribeSystemTheme } from '$lib/theme';

	let { children } = $props();

	const canonical = $derived(pageCanonical(page.url.pathname));
	const ogImage = $derived(siteAsset('/og.png'));

	const nav = [
		{ href: '/', label: 'Labs' },
		{ href: '/review', label: 'Review' },
		{ href: '/reference', label: 'Reference' }
	] as const;

	const queue = $derived(progress.stats.queue);
	const labRoute = $derived(page.url.pathname.startsWith('/lab/'));

	onMount(() => {
		applyLook(readLookId(), readThemePref());
		return subscribeSystemTheme();
	});

	function skipToMain(event: MouseEvent) {
		event.preventDefault();
		const main = document.getElementById('main');
		if (!(main instanceof HTMLElement)) return;
		armSkipLanding(main);
		main.scrollIntoView({ block: 'start' });
	}

	function clearSkipLanding(event: FocusEvent) {
		if (event.currentTarget instanceof HTMLElement) disarmSkipLanding(event.currentTarget);
	}
</script>

<svelte:head>
	{#each activeSystem.fonts as face (face.file ?? face.family)}
		{#if face.file}
			<link
				rel="preload"
				href="{assets}/fonts/{face.file}"
				as="font"
				type="font/woff2"
				crossorigin="anonymous"
			/>
		{/if}
	{/each}
	{#if canonical}
		<link rel="canonical" href={canonical} />
		<meta property="og:url" content={canonical} />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Korean — labs and review" />
	<meta property="og:description" content={SITE_DESCRIPTION} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Korean — labs and review" />
	<meta name="twitter:description" content={SITE_DESCRIPTION} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta property="og:image:alt" content={OG_IMAGE_ALT} />
		<meta name="twitter:image" content={ogImage} />
		<meta name="twitter:image:alt" content={OG_IMAGE_ALT} />
	{/if}
</svelte:head>

<a class="skip" href="#main" onclick={skipToMain}>Skip to content</a>

<div class="frame">
<header class={['bar', { 'lab-route': labRoute }]}>
	<div class="inner">
		<a class="brand" href={resolve('/')} aria-label="Korean 한">
			<span class="name">Korean</span>
			<span class="mark" lang="ko">한</span>
		</a>
		<nav aria-label="Main navigation">
			{#each nav as item (item.href)}
				{@const isActive = item.href === '/'
					? page.url.pathname === '/' || page.url.pathname.startsWith('/lab/')
					: page.url.pathname.startsWith(item.href)}
				<a
					href={resolve(item.href)}
					class:active={isActive}
					aria-current={isActive ? 'page' : undefined}
					aria-label={item.href === '/review' && queue > 0
						? `Review, ${queue} cards due`
						: undefined}
				>
					{#if item.href === '/review'}
						Revie<span class="review-w">w{#if queue > 0}<span class="badge" aria-hidden="true"><span class="badge-n">{queue}</span></span>{/if}</span>
					{:else}
						{item.label}
					{/if}
				</a>
			{/each}
		</nav>
		<SettingsLink />
	</div>
</header>

<main id="main" onblur={clearSkipLanding}>
	{@render children()}
</main>
</div>

<style>
	.frame {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

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

	main {
		flex: 1 1 auto;
		position: relative;
	}

	.bar {
		position: sticky;
		top: 0;
		z-index: 5;
		padding-top: env(safe-area-inset-top);
		background: var(--chrome);
		border-bottom: 1px solid var(--rule);
		overflow: visible;
	}

	.inner {
		min-height: 44px;
		height: auto;
		max-width: var(--shell);
		margin: 0 auto;
		padding-block: 0;
		padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
		display: flex;
		align-items: center;
		gap: var(--s4);
		overflow: visible;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--s2);
		flex-shrink: 0;
		min-width: 44px;
		min-height: 44px;
		padding-inline: 0.2rem;
		white-space: nowrap;
		text-decoration: none;
		color: var(--ink);
		font-weight: 400;
	}

	.mark {
		font-family: var(--hangul);
		font-size: 1.15rem;
		color: var(--accent);
		line-height: 1;
	}

	.name {
		font-family: var(--display);
		font-style: italic;
		font-size: 1rem;
		font-weight: 400;
		letter-spacing: 0;
	}

	nav {
		--tab-r: 12px;
		display: flex;
		flex-wrap: nowrap;
		align-self: stretch;
		align-items: stretch;
		gap: 0.35rem;
		margin-inline-start: auto;
		padding-block-start: 0.6rem;
		padding-inline: var(--tab-r);
		min-width: 0;
		flex-shrink: 1;
		justify-content: flex-end;
		overflow: visible;
	}

	nav a {
		position: relative;
		display: inline-flex;
		align-items: center;
		/* 40px keeps a 0.25rem gap under the bar’s top edge. 44px would kiss that edge. */
		min-height: 40px;
		padding: 0 0.75rem;
		border-radius: 0;
		font-size: 0.84rem;
		text-decoration: none;
		color: var(--ink-soft);
		white-space: nowrap;
		z-index: 0;
		transition: color var(--fast) var(--ease);
	}
	nav a:hover { color: var(--ink); }
	nav a:active { color: var(--ink); }
	nav a.active {
		color: var(--accent);
		background: var(--paper);
		border: 1px solid var(--rule);
		border-block-end: none;
		border-start-start-radius: var(--tab-r);
		border-start-end-radius: var(--tab-r);
		margin-block-end: -1px;
		padding-block-end: 1px;
		z-index: 1;
	}
	nav a.active::before,
	nav a.active::after {
		content: '';
		position: absolute;
		inset-block-end: 0;
		width: var(--tab-r);
		height: var(--tab-r);
		pointer-events: none;
	}
	nav a.active::before {
		inset-inline-start: calc(-1 * var(--tab-r));
		background: radial-gradient(
			circle at 0 0,
			transparent calc(var(--tab-r) - 1px),
			var(--rule) calc(var(--tab-r) - 1px),
			var(--rule) var(--tab-r),
			var(--paper) calc(var(--tab-r) + 0.5px)
		);
	}
	nav a.active::after {
		inset-inline-end: calc(-1 * var(--tab-r));
		background: radial-gradient(
			circle at 100% 0,
			transparent calc(var(--tab-r) - 1px),
			var(--rule) calc(var(--tab-r) - 1px),
			var(--rule) var(--tab-r),
			var(--paper) calc(var(--tab-r) + 0.5px)
		);
	}

	.review-w {
		position: relative;
		display: inline-block;
		overflow: visible;
		vertical-align: baseline;
	}

	.badge {
		position: absolute;
		inset-inline-start: 50%;
		/* Overlap the w so a padded pip stays inside the bar. */
		inset-block-end: calc(100% - 0.38rem);
		translate: -50% 0;
		z-index: 2;
		display: grid;
		place-items: center;
		box-sizing: border-box;
		min-inline-size: 1.35rem;
		min-block-size: 1.35rem;
		padding-block: 0.22rem;
		padding-inline: 0.36rem;
		font-family: var(--mono);
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1;
		background: var(--rose);
		color: var(--accent-ink);
		border-radius: var(--r-pill);
		font-variant-numeric: tabular-nums;
		pointer-events: none;
	}
	.badge-n {
		line-height: 1;
		/* Trim font leading so 10 centers on cap-height, not the em box. */
		text-box: trim-both cap alphabetic;
	}

	@media (min-width: 72rem) {
		.bar.lab-route .inner {
			max-width: var(--sitting);
		}
	}

	@media (max-width: 40rem) {
		.inner { gap: var(--s2); }
		nav {
			gap: 0.2rem;
			padding-block-start: 0.35rem;
		}
		nav a {
			padding-inline: 0.4rem;
			font-size: 0.76rem;
			overflow: visible;
		}
		.review-w {
			/* Room for the hanging half of the pip without widening the tab. */
			padding-inline-end: 4px;
			margin-inline-end: -4px;
		}
		/* Phones: a presence pip only. The count stays in the accessible name.
		   8px (not 0.5rem): --html-size is 106.25%, so 0.5rem is 8.5px and
		   translate -50% lands on a half-pixel, which paints an oval. */
		.badge {
			min-inline-size: 8px;
			min-block-size: 8px;
			max-inline-size: 8px;
			max-block-size: 8px;
			inline-size: 8px;
			block-size: 8px;
			aspect-ratio: 1;
			padding: 0;
			font-size: 0;
			border-radius: 50%;
			translate: none;
			inset-inline-start: calc(100% - 8px);
			inset-block-end: 100%;
		}
		.badge-n {
			display: none;
		}
	}

	@media (max-width: 30rem) {
		.inner {
			padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
			gap: var(--s2);
		}
		.name { font-size: 0.8125rem; }
		nav {
			gap: 0.1rem;
			padding-inline: 0.45rem;
		}
		nav a {
			letter-spacing: -0.03em;
			padding-inline: 0.28rem;
			font-size: 0.7rem;
		}
	}

	@media (max-width: 20rem) {
		.inner {
			height: auto;
			min-height: 44px;
			flex-wrap: wrap;
			row-gap: 0;
		}
		.inner :global(.settings) { order: 2; }
		nav {
			order: 3;
			flex: 1 0 100%;
			justify-content: flex-start;
			margin-inline-start: 0;
			gap: var(--s1);
		}
	}

	@media (forced-colors: active) {
		.bar {
			background: Canvas;
			color: CanvasText;
			border-bottom: 1px solid ButtonBorder;
		}
		.badge {
			background: Highlight;
			color: HighlightText;
		}
		nav a.active {
			background: Highlight;
			color: HighlightText;
			border-color: ButtonBorder;
		}
		nav a.active::before {
			background: radial-gradient(
				circle at 0 0,
				transparent calc(var(--tab-r) - 1px),
				ButtonBorder calc(var(--tab-r) - 1px),
				ButtonBorder var(--tab-r),
				Highlight calc(var(--tab-r) + 0.5px)
			);
		}
		nav a.active::after {
			background: radial-gradient(
				circle at 100% 0,
				transparent calc(var(--tab-r) - 1px),
				ButtonBorder calc(var(--tab-r) - 1px),
				ButtonBorder var(--tab-r),
				Highlight calc(var(--tab-r) + 0.5px)
			);
		}
	}
</style>
