<script lang="ts">
	import { onMount } from 'svelte';
	import { LABS, LABS_BY_ID } from '$lib/content';
	import { resumable } from '$lib/domain/labSession';
	import { labSession } from '$lib/stores/labSession.svelte';
	import { progress } from '$lib/stores/progress.svelte';

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

	const nextLabId = $derived.by(() => {
		if (!ready) return null;
		for (const lab of LABS) {
			const done = progress.isUnlocked(lab.unlocks);
			const blocked = !!lab.requires && !progress.isUnlocked(LABS_BY_ID[lab.requires].unlocks);
			const mid = resumable(sessions[lab.id], lab.steps.length);
			if (!done && !blocked && !mid) return lab.id;
		}
		return null;
	});

	function pct(part: number, whole: number) {
		return whole === 0 ? 0 : Math.round((part / whole) * 100);
	}
</script>

<svelte:head><title>Korean — labs and review</title></svelte:head>

<div class="shell">
	<header class="hero">
		<p class="eyebrow" lang="ko">한글</p>
		<h1>Read Korean from first principles</h1>
		<p class="lede">
			Interactive labs that make you derive the writing system rather than memorise it,
			backed by a spaced-repetition deck that only ever asks about material you have met.
		</p>
	</header>

	<section class="strip" aria-busy={!ready}>
		<a class="stat hot" href="/review" class:quiet={!ready || stats.queue === 0}>
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
	</section>

	<section>
		<h2 class="sec">Labs</h2>
		<div class="labs">
			{#each LABS as lab (lab.id)}
				{@const done = progress.isUnlocked(lab.unlocks)}
				{@const blocked = !!lab.requires && !progress.isUnlocked(LABS_BY_ID[lab.requires].unlocks)}
				{@const mid = ready ? resumable(sessions[lab.id], lab.steps.length) : null}
				<a
					class="lab card"
					href="/lab/{lab.id}"
					class:done={ready && done && !mid}
					class:ahead={ready && blocked && !mid}
					class:resume={!!mid}
				>
					<div class="num">{String(lab.number).padStart(2, '0')}</div>
					<div class="body">
						<h3>{lab.title}</h3>
						<p>{lab.standfirst}</p>
						<div class="meta">
							<span>~{lab.minutes} min</span>
							<span>{lab.steps.length} cards</span>
							<span class="flag">
								{#if mid}
									<span class="go">resume · card {mid.nextIndex + 1} of {lab.steps.length}</span>
								{:else if ready && done}
									<span class="ok">✓ completed</span>
								{:else if ready && blocked}
									<span class="wait">finish Lab {LABS_BY_ID[lab.requires!].number} first</span>
								{:else if lab.id === nextLabId}
									<span class="go">start here</span>
								{/if}
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="sec">Deck</h2>
		<div class="tiers card">
			{#each tiers as tier (tier.id)}
				<div class="tier" class:locked={!ready || !tier.unlocked}>
					<span class="nm">{tier.label}</span>
					<span class="track">
						<span class="m" style="width:{ready ? pct(tier.mature, tier.size) : 0}%"></span>
						<span class="y" style="width:{ready ? pct(tier.young, tier.size) : 0}%"></span>
					</span>
					<span class="ct">
						{#if ready && tier.unlocked}{tier.mature}/{tier.size}{:else}locked{/if}
					</span>
				</div>
			{/each}
			<p class="legend">
				<i class="sw m"></i> mastered (21+ day gap)
				<i class="sw y"></i> learning
				<i class="sw n"></i> not started
			</p>
		</div>
	</section>
</div>

<style>
	.hero { margin-bottom: var(--s6); max-width: var(--measure); }
	h1 { margin: var(--s2) 0 var(--s3); }
	.lede { color: var(--ink-soft); font-size: 1rem; line-height: 1.65; }

	.strip {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--s2);
		margin-bottom: var(--s7);
		min-height: 4.75rem;
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
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}
	a.stat.hot:not(.quiet) { border-color: var(--accent); background: var(--accent-soft); }
	a.stat.hot:not(.quiet) b { color: var(--accent); }
	a.stat:hover { transform: translateY(-2px); border-color: var(--accent); }

	.sec {
		font-family: var(--sans);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-faint);
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

	.num {
		font-family: var(--mono);
		font-size: 1.5rem;
		color: var(--ink-faint);
		flex: 0 0 auto;
		line-height: 1.2;
	}
	.lab.done .num { color: var(--good); }
	.lab.resume { border-color: var(--accent); }
	.lab.resume .num { color: var(--accent); }

	.lab h3 { font-size: 1.15rem; margin-bottom: var(--s1); }
	.lab p { font-size: 0.88rem; color: var(--ink-soft); margin: 0 0 var(--s2); line-height: 1.55; }

	.meta {
		display: flex;
		gap: var(--s3);
		font-size: 0.7rem;
		color: var(--ink-faint);
		flex-wrap: wrap;
	}
	.flag { min-height: 1em; }
	.meta .ok { color: var(--good); }
	.meta .wait { color: var(--warn); }
	.meta .go { color: var(--accent); }

	/* Not blocked, just out of order — the link still works. */
	.lab.ahead { opacity: 0.72; }

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
		height: 6px;
		background: var(--rule);
		border-radius: 3px;
		overflow: hidden;
		display: flex;
	}
	.track .m { background: var(--good); }
	.track .y { background: var(--accent); }
	.ct {
		flex: 0 0 auto;
		min-width: 6ch;
		text-align: right;
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--ink-faint);
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
		margin-right: var(--s1);
	}
	.sw.m { background: var(--good); }
	.sw.y { background: var(--accent); }
	.sw.n { background: var(--rule); }

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
		.lab.resume { border-color: Highlight; }
		.track { background: ButtonBorder; }
		.track .m { background: Highlight; }
		.track .y { background: ButtonText; }
		.sw.m { background: Highlight; }
		.sw.y { background: ButtonText; }
		.sw.n { background: ButtonBorder; }
	}

	@media (max-width: 34rem) {
		.nm { flex-basis: 6.5rem; }
	}
</style>
