<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { LABS } from '$lib/content';
	import {
		continueAction,
		labCardState,
		requiredLab,
		toCourseLab,
		type CourseNavView
	} from '$lib/domain/courseNav';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { tierCountLabel } from '$lib/domain/srs';
	import { progress } from '$lib/stores/progress.svelte';
	import LabIndexRail from '$lib/components/shell/LabIndexRail.svelte';

	// Prerendered HTML has no stored progress. Gate stats, completion badges,
	// and deck-tier counts until the client has ticked, so we never flash
	// empty or stored values into static HTML.
	let ready = $state(false);
	onMount(() => {
		progress.tick();
		ready = true;
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
			sessionFor: (id) => sessions[id],
			queue: stats.queue
		};
	});

	const next = $derived(continueAction(course, navView));

	function pct(part: number, whole: number) {
		return whole === 0 ? 0 : Math.round((part / whole) * 100);
	}

	function pad(n: number) {
		return String(n).padStart(2, '0');
	}
</script>

<svelte:head><title>Korean — labs and review</title></svelte:head>

<div class="with-rail">
	<div class="shell">
	<header class="hero">
		<p class="eyebrow" lang="ko">한글</p>
		<h1>Read Korean from first principles</h1>
		<p class="lede">
			Interactive labs that make you derive the writing system rather than memorize it.
		</p>
		<p class="wayfind">
			Labs teach Hangul. Review quizzes only what you have already met. Reference is the letter list.
		</p>
	</header>

	{#if next}
		<a class="continue card" href={resolve(next.href as Pathname)} data-kind={next.kind}>
			<div class="continue-copy">
				<p class="eyebrow">{next.kicker}</p>
				<strong class="continue-title">{next.title}</strong>
				<span class="continue-detail">{next.detail}</span>
			</div>
			<span class="continue-go" aria-hidden="true">→</span>
		</a>
	{/if}

	<section class="strip" aria-busy={!ready} aria-label="Course and review statistics">
		<a class="stat hot" href={resolve('/review')} class:quiet={!ready || stats.queue === 0}>
			<b>
				{#if ready}
					{stats.queue}
				{:else}
					<span class="skel" aria-hidden="true"></span>
				{/if}
			</b><span>to review</span>
		</a>
		<div class="stat">
			<b>
				{#if ready}
					{stats.mature}
				{:else}
					<span class="skel" aria-hidden="true"></span>
				{/if}
			</b><span>mastered</span>
		</div>
		<div class="stat">
			<b>
				{#if ready}
					{stats.unlocked}<i>/{stats.total}</i>
				{:else}
					<span class="skel" aria-hidden="true"></span>
				{/if}
			</b><span>unlocked</span>
		</div>
		<div class="stat">
			<b>
				{#if ready}
					{stats.streak}
				{:else}
					<span class="skel" aria-hidden="true"></span>
				{/if}
			</b><span>day streak</span>
		</div>
		<p class="streak-note">Day streak counts review days, not finished labs.</p>
	</section>

	<section aria-labelledby="sec-labs-heading">
		<h2 id="sec-labs-heading" class="sec">Labs</h2>
		<div class="labs">
			{#each LABS as lab (lab.id)}
				{@const item = toCourseLab(lab)}
				{@const card = labCardState(item, course, navView)}
				{@const prior = requiredLab(course, lab.requires)}
				{#if card.locked}
					<article class="lab card ahead" aria-labelledby="lab-{lab.id}-title">
						<div class="num" aria-hidden="true">{pad(lab.number)}</div>
						<div class="body">
							<h3 id="lab-{lab.id}-title">{lab.title}</h3>
							<p>{lab.standfirst}</p>
							<div class="meta">
								<span>~{lab.minutes} min</span>
								<span>{lab.steps.length} cards</span>
								<span class="flag">
									<span class="chip-status wait">Finish Lab {prior ? pad(prior.number) : ''} first</span>
									<a
										class="peek"
										href={resolve('/lab/[id]', { id: lab.id })}
										title="You can look at the cards. Review still waits until you finish Lab {prior ? pad(prior.number) : ''}."
										aria-label="Preview Lab {pad(lab.number)} without finishing Lab {prior ? pad(prior.number) : ''}. Review still waits."
									>Open anyway</a>
								</span>
							</div>
						</div>
					</article>
				{:else}
					<a
						class="lab card"
						href={resolve('/lab/[id]', { id: lab.id })}
						class:done={card.done}
						class:resume={card.resumeAt !== null}
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
									{:else if card.done}
										<span class="chip-status ok">✓ completed</span>
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
		<h2 id="sec-review-heading" class="sec">Review pile</h2>
		<div class="tiers card" role="region" aria-label="Review pile by letter family">
			{#each tiers as tier (tier.id)}
				{@const pctMature = pct(tier.mature, tier.size)}
				{@const pctYoung = pct(tier.young, tier.size)}
				{@const pctUnseen = pct(tier.unseen, tier.size)}
				<div
					class="tier"
					class:locked={!ready || !tier.unlocked}
					role="group"
					aria-label="{tier.label}: {ready && tier.unlocked ? `${tier.mature} mastered, ${tier.young} learning, ${tier.unseen} not started (${tier.size} total)` : 'locked'}"
				>
					<span class="nm">{tier.label}</span>
					<span class="track" aria-hidden="true">
						{#if ready && tier.unlocked}
							<span class="m" style="width:{pctMature}%" title="{tier.mature} mastered ({pctMature}%)"></span>
							<span class="y" style="width:{pctYoung}%" title="{tier.young} learning ({pctYoung}%)"></span>
							<span class="n" style="width:{pctUnseen}%" title="{tier.unseen} not started ({pctUnseen}%)"></span>
						{/if}
					</span>
					<span class="ct" aria-hidden="true">
						{#if ready}{tierCountLabel(tier)}{:else}locked{/if}
					</span>
				</div>
			{/each}
			<p class="legend" aria-hidden="true">
				<i class="sw m"></i> mastered (21+ day gap)
				<i class="sw y"></i> learning
				<i class="sw n"></i> not started
			</p>
		</div>
	</section>
	</div>
	<LabIndexRail />
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
	.wayfind {
		color: var(--ink-soft);
		font-size: 0.92rem;
		line-height: 1.55;
		margin: var(--s3) 0 0;
	}

	.continue {
		display: flex;
		align-items: center;
		gap: var(--s4);
		padding: var(--s4);
		margin-bottom: var(--s5);
		text-decoration: none;
		color: inherit;
		transition: transform var(--fast) var(--ease), box-shadow var(--fast) var(--ease),
			border-color var(--fast) var(--ease);
	}
	.continue:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-2);
		color: inherit;
	}
	.continue-copy { min-width: 0; flex: 1 1 auto; }
	.continue .eyebrow { margin-bottom: var(--s1); }
	.continue-title {
		display: block;
		font-family: var(--display);
		font-style: italic;
		font-size: 1.25rem;
		font-weight: 400;
		letter-spacing: -0.015em;
		line-height: 1.25;
		margin-bottom: var(--s1);
	}
	.continue-detail {
		display: block;
		font-size: 0.86rem;
		color: var(--ink-soft);
		line-height: 1.45;
	}
	.continue-go {
		flex: 0 0 auto;
		font-size: 1.4rem;
		line-height: 1;
	}
	.continue[data-kind='start'] {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.continue[data-kind='start'] .continue-go { color: var(--accent); }
	.continue[data-kind='resume'],
	.continue[data-kind='review'] {
		border-color: var(--rose);
		background: var(--rose-soft);
	}
	.continue[data-kind='resume'] .continue-go,
	.continue[data-kind='review'] .continue-go { color: var(--rose); }
	.continue[data-kind='caught-up'] {
		border-color: var(--rule);
		background: var(--paper-raised);
	}
	.continue[data-kind='caught-up'] .continue-go { color: var(--ink-faint); }

	.strip {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--s2);
		margin-bottom: var(--s7);
		min-height: 4.75rem;
	}
	.streak-note {
		grid-column: 1 / -1;
		margin: 0;
		font-size: 0.72rem;
		line-height: 1.4;
		color: var(--ink-faint);
	}

	@media (min-width: 40rem) {
		.strip { grid-template-columns: repeat(4, 1fr); }
	}

	.stat {
		border: 1px solid var(--rule);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		padding: var(--s3);
		text-align: center;
		text-decoration: none;
		color: inherit;
		min-height: 4.5rem;
		transition: border-color var(--fast) var(--ease), transform var(--fast) var(--ease);
	}
	.stat b {
		font-family: var(--mono);
		font-size: 1.5rem;
		font-weight: 500;
		display: block;
		min-height: 1.5em;
		font-variant-numeric: tabular-nums;
	}
	.stat b i { font-style: normal; font-size: 0.8rem; color: var(--ink-faint); }
	.stat .skel {
		width: 1.6em;
		height: 0.65em;
		margin: 0.42em auto 0.18em;
	}
	.stat span {
		font-size: 0.72rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink);
	}
	a.stat.hot:not(.quiet) { border-color: var(--rose); background: var(--rose-soft); }
	a.stat.hot:not(.quiet) b { color: var(--rose); }
	a.stat:hover { transform: translateY(-2px); border-color: var(--accent); }

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
			border-color var(--fast) var(--ease);
	}
	a.lab:hover { transform: translateY(-2px); box-shadow: var(--shadow-2); border-color: var(--accent); }
	a.lab.resume:hover { border-color: var(--rose); }

	.num {
		font-family: var(--mono);
		font-size: 1.5rem;
		color: var(--ink-faint);
		flex: 0 0 auto;
		line-height: 1.2;
	}
	.lab.done .num { color: var(--good); }
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
		min-height: 1.4em;
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
	}
	.chip-status.ok {
		color: var(--good);
		background: var(--good-soft);
		border-color: color-mix(in srgb, var(--good) 30%, transparent);
	}
	.chip-status.wait {
		color: var(--warn);
		background: var(--warn-soft);
		border-color: color-mix(in srgb, var(--warn) 30%, transparent);
	}
	.chip-status.go {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
	}
	.chip-status.due {
		color: var(--rose);
		background: var(--rose-soft);
		border-color: color-mix(in srgb, var(--rose) 30%, transparent);
	}

	.lab.ahead { opacity: 0.78; }
	.peek {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-size: 0.66rem;
		font-weight: 500;
		color: var(--ink-faint);
		text-decoration: none;
		border-bottom: 1px solid var(--rule-strong);
		line-height: 1.2;
	}
	.peek:hover { color: var(--accent); border-bottom-color: var(--accent); }

	.tiers { padding: var(--s4); }

	.tier {
		display: flex;
		align-items: center;
		gap: var(--s3);
		padding: var(--s2) 0;
		border-bottom: 1px solid var(--rule);
		font-size: 0.82rem;
	}
	.tier:last-of-type { border-bottom: none; }
	.tier.locked { opacity: 0.45; }

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
		.stat {
			background: Canvas;
			color: CanvasText;
			border-color: ButtonBorder;
		}
		a.stat.hot:not(.quiet) {
			border-color: Highlight;
			background: Canvas;
		}
		.continue,
		.lab.resume { border-color: Highlight; }
		.continue { background: Canvas; }
		.track { background: Canvas; }
		.track .m { background: Highlight; }
		.track .y { background: ButtonText; }
		.track .n { background: GrayText; }
		.sw.m { background: Highlight; }
		.sw.y { background: ButtonText; }
		.sw.n { background: GrayText; }
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

	@media (max-width: 34rem) {
		.continue { gap: var(--s3); padding: var(--s3); }
		.continue-title { font-size: 1.1rem; }
	}
</style>
