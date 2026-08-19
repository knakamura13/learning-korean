<script lang="ts">
	import { resolve } from '$app/paths';
	import type { LockedLabPopoverCopy, PopoverPlacement } from '$lib/domain/lockedLab';

	let {
		copy,
		placement,
		priorId,
		skipId,
		onDismiss,
		onSkip,
		onMeasure
	}: {
		copy: LockedLabPopoverCopy;
		placement: PopoverPlacement;
		priorId: string | null;
		skipId: string;
		onDismiss: () => void;
		onSkip: () => void;
		onMeasure?: (size: { w: number; h: number }) => void;
	} = $props();

	function reportSize(node: HTMLElement) {
		const notify = () => onMeasure?.({ w: node.offsetWidth, h: node.offsetHeight });
		const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(notify) : null;
		ro?.observe(node);
		notify();
		queueMicrotask(() => node.querySelector<HTMLElement>('a.btn, button')?.focus());
		return () => ro?.disconnect();
	}

	function onPanelKey(e: KeyboardEvent) {
		const root = e.currentTarget;
		if (!(root instanceof HTMLElement)) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			onDismiss();
			return;
		}
		if (e.key !== 'Tab') return;
		const nodes = [...root.querySelectorAll<HTMLElement>('a.btn, button')];
		if (nodes.length === 0) return;
		const first = nodes[0];
		const last = nodes[nodes.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && active === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}
</script>

<div
	id="locked-lab-pop"
	class="pop"
	style:--pop-x="{placement.left}px"
	style:--pop-y="{placement.top}px"
	role="dialog"
	aria-labelledby="locked-lab-pop-title"
	aria-describedby="locked-lab-pop-body"
	tabindex="-1"
	{@attach reportSize}
	onkeydown={onPanelKey}
>
	<p class="eyebrow">Locked</p>
	<h2 id="locked-lab-pop-title">{copy.title}</h2>
	<p class="lead" id="locked-lab-pop-body">{copy.body}</p>
	<div class="actions">
		{#if priorId && copy.priorLabel}
			<a class="btn" href={resolve('/lab/[id]', { id: priorId })}>{copy.priorLabel}</a>
		{/if}
		<a
			class="btn ghost"
			href={resolve('/lab/[id]', { id: skipId })}
			onclick={onSkip}
		>{copy.skipLabel}</a>
		<button class="btn ghost" type="button" onclick={onDismiss}>{copy.dismissLabel}</button>
	</div>
</div>

<style>
	.pop {
		position: fixed;
		inset-inline-start: var(--pop-x);
		inset-block-start: var(--pop-y);
		z-index: 7;
		width: min(20rem, calc(100vw - 1.5rem));
		padding: var(--s4);
		background: var(--paper-raised);
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		box-shadow: var(--shadow-2);
		color: var(--ink);
	}

	h2 {
		font-family: var(--display);
		font-style: italic;
		font-size: 1.15rem;
		font-weight: 400;
		margin: 0 0 var(--s2);
	}

	.lead {
		margin: 0 0 var(--s4);
		font-size: 0.88rem;
		line-height: 1.5;
		color: var(--ink-soft);
	}

	.actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--s2);
	}
	.actions :global(.btn) {
		justify-content: center;
		width: 100%;
	}

	@media (forced-colors: active) {
		.pop {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
			box-shadow: none;
		}
	}
</style>
