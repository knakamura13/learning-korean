<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { progress } from '$lib/stores/progress.svelte';

	let { children } = $props();

	onNavigate((navigation) => {
		if (!browser) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (!document.startViewTransition) return;
		return new Promise<void>((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

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
			<span class="mark">한</span>
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
		background: color-mix(in srgb, var(--paper) 88%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--rule);
		padding-top: env(safe-area-inset-top);
	}

	.inner {
		max-width: var(--shell);
		margin: 0 auto;
		padding: var(--s3) max(var(--s5), env(safe-area-inset-right)) var(--s3)
			max(var(--s5), env(safe-area-inset-left));
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
		min-height: 44px;
	}

	.mark {
		font-family: var(--hangul);
		font-size: 1.4rem;
		color: var(--accent);
		line-height: 1;
	}

	.name { font-size: 0.9rem; letter-spacing: 0.01em; }

	nav { display: flex; gap: var(--s1); margin-left: auto; }

	nav a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--s1);
		padding: 0.45rem 0.75rem;
		min-height: 44px;
		min-width: 44px;
		border-radius: var(--r-sm);
		font-size: 0.84rem;
		text-decoration: none;
		color: var(--ink-soft);
		transition: background var(--fast) var(--ease), color var(--fast) var(--ease);
	}
	nav a:hover { background: var(--paper-sunk); color: var(--ink); }
	nav a:active { background: var(--paper-sunk); color: var(--ink); }
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
			padding: var(--s3) max(var(--s4), env(safe-area-inset-right)) var(--s3)
				max(var(--s4), env(safe-area-inset-left));
		}
		.name { display: none; }
	}
</style>
