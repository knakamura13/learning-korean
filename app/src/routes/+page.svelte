<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { LABS } from '$lib/content';
	import {
		labCardState,
		nextLabId,
		requiredLab,
		reviewPileDueCopy,
		reviewPileView,
		toCourseLab,
		type CourseNavView
	} from '$lib/domain/courseNav';
	import { lockedLabPopoverCopy, placeClickPopover } from '$lib/domain/lockedLab';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { tierCountLabel } from '$lib/domain/srs';
	import { progress } from '$lib/stores/progress.svelte';
	import LabIndexRail from '$lib/components/shell/LabIndexRail.svelte';
	import LockedLabPopover from '$lib/components/shell/LockedLabPopover.svelte';

	// Prerendered HTML has no stored progress. Gate completion badges
	// and deck-tier counts until the client has ticked, so we never flash
	// empty or stored values into static HTML.
	let ready = $state(false);
	let lockedOpen = $state<{ labId: string; x: number; y: number } | null>(null);
	let panelSize = $state({ w: 320, h: 220 });
	let viewport = $state({ w: 1200, h: 800 });

	onMount(() => {
		progress.tick();
		ready = true;
		const sync = () => {
			viewport = { w: window.innerWidth, h: window.innerHeight };
		};
		sync();
		window.addEventListener('resize', sync);
		return () => window.removeEventListener('resize', sync);
	});

	const stats = $derived(progress.stats);
	const tiers = $derived(progress.tierProgress);
	const sessions = $derived(labSession.all);
	const course = LABS.map(toCourseLab);

	const navView = $derived.by((): CourseNavView => {
		const unlocked = new Set(course.filter((lab) => progress.isUnlocked(lab.unlocks)).map((lab) => lab.unlocks));
		return {
			ready,
			isUnlocked: (tier) => unlocked.has(tier),
			isOpened: (id) => progress.isOpened(id),
			sessionFor: (id) => sessions[id],
			queue: stats.queue
		};
	});

	const pile = $derived(
		reviewPileView(navView.ready, tiers.filter((tier) => tier.unlocked).length, navView.queue)
	);
	const dueCopy = $derived(
		reviewPileDueCopy(
			pile.due,
			course.find((lab) => lab.id === nextLabId(course, navView)) ?? null
		)
	);

	function pct(part: number, whole: number) {
		return whole === 0 ? 0 : Math.round((part / whole) * 100);
	}

	function pad(n: number) {
		return String(n).padStart(2, '0');
	}

	const lockedLab = $derived.by(() => {
		const open = lockedOpen;
		if (!open) return null;
		return LABS.find((item) => item.id === open.labId) ?? null;
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
	const lockedPlacement = $derived(
		lockedOpen ? placeClickPopover(lockedOpen, panelSize, viewport) : null
	);

	function openLocked(e: MouseEvent, labId: string) {
		const node = e.currentTarget;
		let x = e.clientX;
		let y = e.clientY;
		if (x === 0 && y === 0 && node instanceof HTMLElement) {
			const box = node.getBoundingClientRect();
			x = box.left + Math.min(48, box.width / 2);
			y = box.top + Math.min(48, box.height / 2);
		}
		lockedOpen = { labId, x, y };
	}

	function dismissLocked() {
		lockedOpen = null;
	}

	function closeLocked() {
		const id = lockedOpen?.labId;
		dismissLocked();
		if (!id) return;
		queueMicrotask(() =>
			document.querySelector<HTMLButtonElement>(`button.lab.ahead[data-lab-id="${id}"]`)?.focus()
		);
	}

	function skipLocked() {
		if (!lockedOpen) return;
		progress.openLab(lockedOpen.labId);
	}

	function onWindowPointerDown(e: PointerEvent) {
		if (!lockedOpen) return;
		const target = e.target;
		if (!(target instanceof Node)) return;
		const pop = document.getElementById('locked-lab-pop');
		if (pop?.contains(target)) return;
		if (target instanceof Element && target.closest('button.lab.ahead')) return;
		dismissLocked();
	}

	function onWindowKey(e: KeyboardEvent) {
		if (e.key !== 'Escape' || !lockedOpen) return;
		e.preventDefault();
		closeLocked();
	}
</script>

<svelte:head><title>Korean — labs and review</title></svelte:head>
<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onWindowKey} />

<div class="with-rail">
	<div class="shell">
	<header class="hero">
		<p class="eyebrow" lang="ko">한글</p>
		<h1>Read Korean from first principles</h1>
		<p class="lede">
			Interactive labs that make you derive the writing system rather than memorize it.
		</p>
	</header>

	<section aria-labelledby="sec-labs-heading">
		<h2 id="sec-labs-heading" class="sec">Labs</h2>
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
						aria-expanded={lockedOpen?.labId === lab.id}
						aria-controls={lockedOpen?.labId === lab.id ? 'locked-lab-pop' : undefined}
						onclick={(e) => openLocked(e, lab.id)}
					>
						<div class="num" aria-hidden="true">{pad(lab.number)}</div>
						<div class="body">
							<h3 id="lab-{lab.id}-title">{lab.title}</h3>
							<p>{lab.standfirst}</p>
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
							<p>{lab.standfirst}</p>
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

	<section aria-labelledby="sec-review-heading">
		<div class="sec-row">
			<h2 id="sec-review-heading" class="sec">Review pile</h2>
			{#if pile.body === 'progress' && pile.due > 0}
				<a
					class="btn"
					href={resolve('/review')}
					aria-label="{pile.due} cards due for review"
				>Review {pile.due} due</a>
			{/if}
		</div>
		<div
			class="tiers card"
			class:due={pile.due > 0}
			role="region"
			aria-busy={pile.body === 'loading'}
			aria-label={pile.due > 0
				? `Review pile by letter family, ${pile.due} cards due`
				: 'Review pile by letter family'}
		>
			{#if pile.body === 'loading'}
				<div class="pile-skel" aria-hidden="true">
					{#each tiers as tier (tier.id)}
						<div class="tier skel-row">
							<span class="nm"><span class="skel line-ph"></span></span>
							<span class="track"></span>
							<span class="ct"><span class="skel line-ph short"></span></span>
						</div>
					{/each}
				</div>
			{:else if pile.body === 'empty'}
				<p class="pile-empty">
					Letters land here after you finish a lab. Lab 01 unlocks {tiers[0]?.size ?? 19} consonants.
				</p>
			{:else}
				{#if dueCopy}
					<p class="pile-due">{dueCopy}</p>
				{/if}
				{#each tiers as tier (tier.id)}
					{@const pctMature = pct(tier.mature, tier.size)}
					{@const pctYoung = pct(tier.young, tier.size)}
					{@const pctUnseen = pct(tier.unseen, tier.size)}
					<div
						class="tier"
						class:locked={!tier.unlocked}
						role="group"
						aria-label="{tier.label}: {tier.unlocked ? `${tier.mature} mastered, ${tier.young} learning, ${tier.unseen} not started (${tier.size} total)` : 'locked'}"
					>
						<span class="nm">{tier.label}</span>
						<span class="track" aria-hidden="true">
							{#if tier.unlocked}
								<span class="m" style="width:{pctMature}%" title="{tier.mature} mastered ({pctMature}%)"></span>
								<span class="y" style="width:{pctYoung}%" title="{tier.young} learning ({pctYoung}%)"></span>
								<span class="n" style="width:{pctUnseen}%" title="{tier.unseen} not started ({pctUnseen}%)"></span>
							{/if}
						</span>
						<span class="ct" aria-hidden="true">{tierCountLabel(tier)}</span>
					</div>
				{/each}
				<p class="legend" aria-hidden="true">
					<i class="sw m"></i> mastered (21+ day gap)
					<i class="sw y"></i> learning
					<i class="sw n"></i> not started
				</p>
			{/if}
		</div>
	</section>
	</div>
	<LabIndexRail />
	{#if lockedOpen && lockedCopy && lockedPlacement && lockedLab}
		<LockedLabPopover
			copy={lockedCopy}
			placement={lockedPlacement}
			priorId={lockedPrior?.id ?? null}
			skipId={lockedLab.id}
			onDismiss={closeLocked}
			onSkip={skipLocked}
			onMeasure={(size) => {
				panelSize = size;
			}}
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

	.sec-row {
		display: flex;
		align-items: center;
		gap: var(--s3);
		flex-wrap: wrap;
		margin: 0 0 var(--s3);
		min-height: 44px;
	}
	.sec-row .sec { margin: 0; }

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
		color: color-mix(in srgb, var(--accent-ink) 82%, var(--accent));
	}
	a.lab.now::before,
	a.lab.now::after {
		border-color: color-mix(in srgb, var(--accent-ink) 40%, transparent);
	}
	.lab.done .num { color: var(--ink-faint); }
	.lab.done h3,
	.lab.done p {
		color: var(--ink-soft);
	}
	a.lab:not(.now):not(.done):not(.resume) .num { color: var(--accent); }
	.lab.resume { border-color: var(--rose); }
	.lab.resume .num { color: var(--rose); }

	.lab h3 { font-size: 1.15rem; margin-bottom: var(--s1); }
	.lab p { font-size: 0.88rem; color: var(--ink-soft); margin: 0 0 var(--s2); line-height: 1.55; }

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
		font-size: 0.66rem;
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

	.tiers { padding: var(--s4); }
	.tiers.due {
		border-color: var(--rose);
	}

	.pile-due {
		margin: 0 0 var(--s3);
		font-size: 0.88rem;
		line-height: 1.45;
		color: var(--rose);
		max-width: 32rem;
	}

	.pile-empty {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--ink-soft);
		max-width: 32rem;
		min-height: 16rem;
	}
	.pile-skel .line-ph {
		width: 7rem;
		max-width: 90%;
		height: 0.7rem;
	}
	.pile-skel .line-ph.short {
		width: 4.5rem;
	}
	.skel-row .track {
		background: var(--paper-sunk);
	}

	.tier {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) 0;
		border-bottom: 1px solid var(--rule);
		font-size: 0.82rem;
	}
	.tier:last-of-type { border-bottom: none; }
	.tier.locked { color: var(--ink-faint); }

	.nm { flex: 0 0 9rem; }
	.track {
		flex: 1 1 auto;
		height: 8px;
		background: var(--rule);
		border-radius: 4px;
		overflow: hidden;
		display: flex;
	}
	.track .m { background: var(--good); }
	.track .y { background: var(--accent); }
	.track .n { background: var(--rule-strong); }
	.ct {
		flex: 0 0 auto;
		min-width: 8ch;
		text-align: end;
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--ink-faint);
		font-variant-numeric: tabular-nums;
	}

	.legend {
		margin: var(--s3) 0 0;
		font-size: 0.68rem;
		color: var(--ink-faint);
		display: flex;
		gap: var(--s4);
		flex-wrap: wrap;
		align-items: center;
	}
	.sw {
		display: inline-block;
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 2px;
		margin-inline-end: var(--s1);
	}
	.sw.m { background: var(--good); }
	.sw.y { background: var(--accent); }
	.sw.n { background: var(--rule-strong); }

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
		a.lab:not(.now):not(.done):not(.resume) .num { color: LinkText; }
		.tiers.due { border-color: Highlight; }
		.pile-due { color: LinkText; }
		.track { background: Canvas; }
		.track .m { background: Highlight; }
		.track .y { background: ButtonText; }
		.track .n { background: GrayText; }
		.sw.m { background: Highlight; }
		.sw.y { background: ButtonText; }
		.sw.n { background: GrayText; }
		.chip-status.wait {
			color: GrayText;
			border-color: GrayText;
		}
		.chip-status.due {
			color: LinkText;
			border-color: LinkText;
		}
	}

	@media (max-width: 40rem) {
		.tier {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				'nm ct'
				'track track';
			column-gap: var(--s2);
			row-gap: var(--s1);
			align-items: baseline;
		}
		.nm {
			grid-area: nm;
			flex: none;
			min-width: 0;
		}
		.ct { grid-area: ct; min-width: 0; }
		.track { grid-area: track; width: 100%; }
	}

</style>
