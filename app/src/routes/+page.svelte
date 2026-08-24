<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { LABS } from '$lib/content';
	import {
		courseComplete,
		courseNavView,
		labCardState,
		requiredLab,
		toCourseLab
	} from '$lib/domain/courseNav';
	import { lockedLabPopoverCopy } from '$lib/domain/lockedLab';
	import { reviewLoadCopy } from '$lib/domain/reviewLoad';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';
	import LabIndexRail from '$lib/components/shell/LabIndexRail.svelte';
	import LockedLabPopover from '$lib/components/shell/LockedLabPopover.svelte';
	import KoText from '$lib/components/KoText.svelte';

	// Prerendered HTML has no stored progress. Gate completion badges
	// until the client has ticked, so we never flash stored values into static HTML.
	let ready = $state(false);
	let lockedOpen = $state<string | null>(null);

	onMount(() => {
		progress.tick();
		ready = true;
	});

	const sessions = $derived(labSession.all);
	const course = LABS.map(toCourseLab);
	const sitting = $derived(progress.stats.sitting);
	const load = $derived(reviewLoadCopy(progress.stats, progress.studyPrefs.reviewsPerSitting));

	const navView = $derived.by(() =>
		courseNavView({
			ready,
			labs: course,
			isUnlocked: (tier) => progress.isUnlocked(tier),
			isOpened: (id) => progress.isOpened(id),
			sessionFor: (id) => sessions[id]
		})
	);

	const labsDone = $derived(courseComplete(course, navView));

	function pad(n: number) {
		return String(n).padStart(2, '0');
	}

	const lockedLab = $derived.by(() => {
		const open = lockedOpen;
		if (!open) return null;
		return LABS.find((item) => item.id === open) ?? null;
	});
	const lockedPrior = $derived(lockedLab ? requiredLab(course, lockedLab.requires) : null);
	const lockedCopy = $derived(
		lockedLab
			? lockedLabPopoverCopy(
					{ number: lockedLab.number, title: lockedLab.title },
					lockedPrior ? { number: lockedPrior.number, title: lockedPrior.title } : null
				)
			: null
	);

	function openLocked(labId: string) {
		lockedOpen = labId;
	}

	function dismissLocked() {
		lockedOpen = null;
	}

	function closeLocked() {
		const id = lockedOpen;
		dismissLocked();
		if (!id) return;
		queueMicrotask(() =>
			document.querySelector<HTMLButtonElement>(`button.lab.ahead[data-lab-id="${id}"]`)?.focus()
		);
	}

	function skipLocked() {
		if (!lockedOpen) return;
		progress.openLab(lockedOpen);
	}

	function onWindowKey(e: KeyboardEvent) {
		if (e.key !== 'Escape' || !lockedOpen) return;
		e.preventDefault();
		closeLocked();
	}
</script>

<svelte:head><title>Korean — labs</title></svelte:head>
<svelte:window onkeydown={onWindowKey} />

<div class="with-rail">
	<div class="shell">
	<header class="hero">
		<p class="eyebrow" lang="ko">한글</p>
		<h1>Read Korean from first principles</h1>
		<p class="lede">
			Interactive labs that make you derive the writing system rather than memorize it.
		</p>
		{#if ready && sitting > 0}
			<p class="due-line">
				<a class="due-chip" href={resolve('/review')} aria-label={load.actionAria}>
					{sitting} due → Review
				</a>
			</p>
		{/if}
	</header>

	<section aria-labelledby="sec-labs-heading">
		<h2 id="sec-labs-heading" class="sec">Labs</h2>
		{#if labsDone}
			<p class="course-done">Labs are done. Review and Drill keep the inventory warm.</p>
		{/if}
		<div class="labs">
			{#each LABS as lab (lab.id)}
				{@const item = toCourseLab(lab)}
				{@const card = labCardState(item, course, navView)}
				{@const prior = requiredLab(course, lab.requires)}
				{#if card.locked}
					<button
						type="button"
						class="lab card ahead"
						data-lab-id={lab.id}
						aria-labelledby="lab-{lab.id}-title"
						aria-haspopup="dialog"
						aria-expanded={lockedOpen === lab.id}
						aria-controls={lockedOpen === lab.id ? 'locked-lab-pop' : undefined}
						onclick={() => openLocked(lab.id)}
					>
						<div class="num" aria-hidden="true">{pad(lab.number)}</div>
						<div class="body">
							<h3 id="lab-{lab.id}-title">{lab.title}</h3>
							<p><KoText text={lab.standfirst} /></p>
							<div class="meta">
								<span>~{lab.minutes} min</span>
								<span>{lab.steps.length} cards</span>
								<span class="flag">
									<span class="chip-status wait">
										<svg class="lock" viewBox="0 0 16 16" aria-hidden="true">
											<rect
												x="3"
												y="7"
												width="10"
												height="8"
												rx="1.5"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
											/>
											<path
												d="M5 7V5a3 3 0 0 1 6 0v2"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
											/>
										</svg>
										{#if prior}
											Needs Lab {pad(prior.number)}
										{:else}
											Locked
										{/if}
									</span>
								</span>
							</div>
						</div>
					</button>
				{:else}
					<a
						class="lab card"
						href={resolve('/lab/[id]', { id: lab.id })}
						class:now={card.startHere}
						class:done={card.done}
						class:resume={card.resumeAt !== null}
						aria-current={card.startHere ? 'step' : undefined}
						aria-labelledby="lab-{lab.id}-title"
					>
						<div class="num" aria-hidden="true">{pad(lab.number)}</div>
						<div class="body">
							<h3 id="lab-{lab.id}-title">{lab.title}</h3>
							<p><KoText text={lab.standfirst} /></p>
							<div class="meta">
								<span>~{lab.minutes} min</span>
								<span>{lab.steps.length} cards</span>
								<span class="flag">
									{#if card.resumeAt !== null}
										<span class="chip-status due">resume · card {card.resumeAt + 1} of {lab.steps.length}</span>
									{:else if card.startHere}
										<span class="chip-status go">start here</span>
									{/if}
								</span>
							</div>
						</div>
					</a>
				{/if}
			{/each}
		</div>
	</section>
	</div>
	<LabIndexRail />
	{#if lockedOpen && lockedCopy && lockedLab}
		<LockedLabPopover
			copy={lockedCopy}
			priorId={lockedPrior?.id ?? null}
			skipId={lockedLab.id}
			onDismiss={closeLocked}
			onSkip={skipLocked}
		/>
	{/if}
</div>

<style>
	.with-rail {
		display: block;
	}
	@media (min-width: 72rem) {
		.with-rail {
			display: grid;
			grid-template-areas: 'rail main';
			grid-template-columns: 56px minmax(0, 1fr);
			column-gap: var(--s4);
			max-width: var(--shell);
			margin-inline: auto;
			padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
		}
		.with-rail .shell {
			grid-area: main;
			max-width: none;
			width: 100%;
			padding-inline: 0;
		}
		.with-rail :global(.lab-index) {
			grid-area: rail;
		}
	}

	.hero { margin-bottom: var(--s5); max-width: var(--measure); }
	h1 {
		margin: var(--s2) 0 var(--s3);
		font-family: var(--display);
		font-style: italic;
		font-weight: 400;
	}
	.lede { color: var(--ink-soft); font-size: 1rem; line-height: 1.65; }

	.due-line {
		margin: var(--s3) 0 0;
	}
	.due-chip {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0.35rem 0.85rem;
		border-radius: var(--r-pill);
		border: 1px solid color-mix(in srgb, var(--rose) 35%, transparent);
		background: var(--rose-soft);
		color: var(--rose);
		font-size: 0.84rem;
		font-weight: 600;
		text-decoration: none;
		transition: border-color var(--fast) var(--ease), filter var(--fast) var(--ease);
	}
	.due-chip:hover {
		border-color: var(--rose);
		filter: brightness(1.05);
	}
	.due-chip:focus-visible {
		outline: 2px solid var(--paper);
		outline-offset: 2px;
		box-shadow: var(--focus-ring);
	}

	.sec {
		font-family: var(--display);
		font-style: italic;
		font-size: 1.15rem;
		font-weight: 400;
		letter-spacing: -0.015em;
		text-transform: none;
		color: var(--ink);
		margin: 0 0 var(--s3);
	}

	.course-done {
		margin: 0 0 var(--s4);
		max-width: var(--measure);
		font-size: 0.92rem;
		line-height: 1.55;
		color: var(--ink-soft);
	}

	section { margin-bottom: var(--s7); }

	.labs { display: grid; gap: var(--s3); }

	.lab {
		display: flex;
		gap: var(--s4);
		padding: var(--s4);
		min-width: 0;
		text-decoration: none;
		color: inherit;
		transition: transform var(--fast) var(--ease), box-shadow var(--fast) var(--ease),
			border-color var(--fast) var(--ease), filter var(--fast) var(--ease),
			background var(--fast) var(--ease), color var(--fast) var(--ease);
	}
	button.lab {
		appearance: none;
		font: inherit;
		text-align: start;
		width: 100%;
		cursor: pointer;
	}
	a.lab:hover,
	button.lab:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); border-color: var(--accent); }
	/* Scoped .lab:hover beats global .card:focus-visible — keep the ring like .btn. */
	a.lab:focus-visible,
	button.lab:focus-visible,
	a.lab:hover:focus-visible,
	button.lab:hover:focus-visible {
		box-shadow: var(--focus-ring), var(--shadow-1);
	}
	a.lab:active,
	button.lab:active {
		transform: translateY(0);
		box-shadow: var(--shadow-1);
	}
	a.lab.now:hover {
		border-color: var(--accent);
		color: var(--accent-ink);
		filter: brightness(1.07);
	}
	a.lab.resume:hover { border-color: var(--rose); }
	a.lab.now:hover .chip-status.go {
		color: var(--accent);
	}

	.num {
		font-family: var(--mono);
		font-size: 1.5rem;
		color: var(--ink-faint);
		flex: 0 0 auto;
		line-height: 1.2;
	}
	.lab.now {
		background: var(--accent);
		color: var(--accent-ink);
		border-color: var(--accent);
	}
	.lab.now .num { color: var(--accent-ink); }
	.lab.now p,
	.lab.now .meta {
		color: color-mix(in srgb, var(--accent-ink) 92%, var(--accent));
	}
	a.lab.now::before,
	a.lab.now::after {
		border-color: color-mix(in srgb, var(--accent-ink) 40%, transparent);
	}
	.lab.done .num { color: var(--ink-faint); }
	.lab.resume { border-color: var(--rose); }
	.lab.resume .num { color: var(--rose); }

	.lab h3 { font-size: 1.15rem; margin-bottom: var(--s1); }
	.lab p { font-size: 0.88rem; color: var(--ink-soft); margin: 0 0 var(--s2); line-height: 1.55; max-width: var(--measure); }

	.meta {
		display: flex;
		gap: var(--s3);
		font-size: 0.7rem;
		color: var(--ink-faint);
		flex-wrap: wrap;
		align-items: center;
	}
	.flag {
		min-height: 1.6rem;
		display: inline-flex;
		align-items: center;
		gap: var(--s2);
		flex-wrap: wrap;
	}
	.chip-status {
		display: inline-flex;
		align-items: center;
		padding: 0.12rem 0.5rem;
		border-radius: var(--r-pill);
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.2;
		border: 1px solid transparent;
		cursor: default;
	}
	.chip-status.wait {
		color: var(--warn);
		background: var(--warn-soft);
		border-color: color-mix(in srgb, var(--warn) 30%, transparent);
		gap: 0.3rem;
	}
	.lock {
		width: 0.75rem;
		height: 0.75rem;
		flex: 0 0 auto;
	}
	.chip-status.go {
		color: var(--accent-ink);
		background: var(--accent);
		border-color: var(--accent);
	}
	.lab.now .chip-status.go {
		color: var(--accent);
		background: var(--accent-ink);
		border-color: var(--accent-ink);
	}
	.chip-status.due {
		color: var(--rose);
		background: var(--rose-soft);
		border-color: color-mix(in srgb, var(--rose) 30%, transparent);
	}

	.lab.ahead {
		background: var(--paper-sunk);
	}
	.lab.ahead h3,
	.lab.ahead p {
		color: var(--ink-soft);
	}

	@media (forced-colors: active) {
		.lab.now {
			background: Highlight;
			color: HighlightText;
			border-color: Highlight;
			filter: none;
		}
		.lab.now .num,
		.lab.now p,
		.lab.now .meta {
			color: HighlightText;
		}
		.lab.now .chip-status.go {
			color: Highlight;
			background: HighlightText;
			border-color: HighlightText;
		}
		.lab.resume { border-color: Highlight; }
		.chip-status.wait {
			color: GrayText;
			border-color: GrayText;
		}
		.chip-status.due {
			color: LinkText;
			border-color: LinkText;
		}
		.due-chip {
			background: Canvas;
			color: LinkText;
			border-color: LinkText;
		}
	}
</style>
