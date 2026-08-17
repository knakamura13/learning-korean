<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { ContinueAction } from '$lib/domain/courseNav';
	import type { SittingCopy } from '$lib/domain/sitting';

	let {
		action,
		copy,
		titlePage,
		ready,
		footnoteQueue
	}: {
		action: ContinueAction;
		copy: SittingCopy;
		titlePage: boolean;
		ready: boolean;
		footnoteQueue: number;
	} = $props();

	const ctaClass = $derived.by(() => {
		switch (action.kind) {
			case 'start':
				return 'btn';
			case 'resume':
			case 'review':
				return 'btn rose';
			case 'caught-up':
				return 'btn ghost';
			default: {
				const _exhaustive: never = action.kind;
				return _exhaustive;
			}
		}
	});
</script>

<article class="sitting" data-kind={action.kind} aria-busy={!ready}>
	{#if titlePage}
		<h1 class="masthead">
			<span class="mast-en">Korean</span>
			<span class="mast-han" lang="ko">한</span>
		</h1>
	{/if}
	<p class="kicker" data-kind={action.kind}>{copy.kicker}</p>
	{#if !titlePage}
		<h1 class="title" title={copy.title}>{copy.title}</h1>
	{/if}
	<p class="lead">{copy.lead}</p>
	<a class={ctaClass} href={resolve(action.href as Pathname)}>{copy.cta}</a>
	{#if action.kind === 'resume' && footnoteQueue > 0}
		<p class="footnote">
			<span class="n">{footnoteQueue}</span>
			due after this sitting
		</p>
	{/if}
</article>

<style>
	.sitting {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding-bottom: var(--s4);
	}

	.masthead {
		display: flex;
		align-items: baseline;
		gap: var(--s3);
		margin: 0 0 var(--s5);
		animation: rise var(--slow) var(--ease) both;
	}
	.mast-en {
		font-family: var(--display);
		font-size: 44px;
		font-weight: 300;
		letter-spacing: -0.02em;
		line-height: 1.1;
		font-style: italic;
	}
	.mast-han {
		font-family: var(--hangul);
		font-size: 36px;
		font-weight: 500;
		color: var(--accent);
		line-height: 1;
	}

	.kicker {
		margin: 0 0 var(--s5);
		font-family: var(--sans);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--accent);
		animation: rise var(--slow) var(--ease) both;
	}
	.kicker[data-kind='resume'],
	.kicker[data-kind='review'] { color: var(--rose); }
	.kicker[data-kind='caught-up'] { color: var(--ink-soft); }

	.title {
		margin: 0 0 var(--s4);
		font-size: 28px;
		font-weight: 400;
		letter-spacing: -0.015em;
		line-height: 1.18;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		animation: rise var(--slow) var(--ease) 70ms both;
	}

	.lead {
		margin: 0 0 var(--s6);
		font-family: var(--serif);
		font-size: 18px;
		font-weight: 400;
		line-height: 1.6;
		hyphens: auto;
		color: var(--ink);
		animation: rise var(--slow) var(--ease) 140ms both;
	}

	.sitting :global(.btn) {
		animation: rise var(--slow) var(--ease) 210ms both;
	}

	.footnote {
		margin: var(--s5) 0 0;
		font-size: 12px;
		color: var(--ink-soft);
		line-height: 1.45;
	}
	.footnote .n {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
		color: var(--rose);
		margin-inline-end: var(--s1);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (forced-colors: active) {
		.kicker[data-kind='start'] { color: Highlight; }
		.kicker[data-kind='resume'],
		.kicker[data-kind='review'] { color: LinkText; }
		.mast-han { color: Highlight; }
		.footnote .n { color: LinkText; }
	}
</style>
