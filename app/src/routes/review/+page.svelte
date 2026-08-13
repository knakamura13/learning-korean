<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { shouldIgnoreShortcut } from '$lib/a11y/shortcuts';
	import { progress } from '$lib/stores/progress.svelte';
	import { checkAnswer, type Card } from '$lib/domain/deck';
	import { DEFAULT_NEW_PER_DAY } from '$lib/domain/srs';
	import { LABS } from '$lib/content';

	let queue = $state<Card[]>([]);
	let index = $state(0);
	let shown = $state(0);
	let right = $state(0);
	let typed = $state('');
	let answered = $state(false);
	let verdict = $state<{ ok: boolean; speed: string; when: string } | null>(null);
	let startedAt = 0;
	let input = $state<HTMLInputElement | undefined>();
	let ready = $state(false);
	let emptyHint = $state(false);

	const card = $derived(queue[index]);
	const finishedSession = $derived(ready && queue.length > 0 && index >= queue.length);

	onMount(() => {
		progress.tick();
		start();
		ready = true;
	});

	function start() {
		progress.tick();
		queue = progress.queue;
		index = 0;
		shown = 0;
		right = 0;
		reset();
	}

	async function reset() {
		typed = '';
		answered = false;
		verdict = null;
		emptyHint = false;
		startedAt = Date.now();
		await tick();
		input?.focus();
	}

	function submit() {
		if (answered) return next();
		const value = typed.trim();
		if (!value) {
			emptyHint = true;
			return;
		}
		emptyHint = false;

		const ms = Date.now() - startedAt;
		const ok = checkAnswer(card, value);
		const wasNew = !progress.state.cards[card.id];
		const result = progress.answer(card.id, ok, ms);

		answered = true;
		shown += 1;
		if (ok) right += 1;

		const ivl = result.card.ivl;
		verdict = {
			ok,
			speed: ok ? (ms < 3500 ? 'fast' : ms < 9000 ? 'steady' : 'slow') : '',
			when:
				ivl === 0
					? 'again in 10 minutes'
					: ivl < 2
						? 'again in 1 day'
						: `again in ${Math.round(ivl)} days`
		};
		void wasNew;
	}

	function next() {
		// A missed card returns at the end of this sitting, not only in 10 minutes.
		if (verdict && !verdict.ok && queue.length < 60 && queue.lastIndexOf(card) === index) {
			queue = [...queue, card];
		}
		index += 1;
		reset();
	}

	function onKey(e: KeyboardEvent) {
		if (shouldIgnoreShortcut(e.target)) return;
		if (e.key === 'Enter' && answered) {
			e.preventDefault();
			next();
		}
	}

	const stats = $derived(progress.stats);
	const nextDue = $derived(progress.nextDue);

	const whenNext = $derived.by(() => {
		if (nextDue === null) return 'later';
		const hours = Math.max(0, Math.round((nextDue - Date.now()) / 3.6e6));
		if (hours < 1) return 'in under an hour';
		if (hours < 24) return `in about ${hours} hour${hours === 1 ? '' : 's'}`;
		const days = Math.round(hours / 24);
		return `in ${days} day${days === 1 ? '' : 's'}`;
	});
</script>

<svelte:head><title>Daily review</title></svelte:head>
<svelte:window onkeydown={onKey} />

<div class="shell narrow">
	<header class="head">
		<p class="eyebrow">Spaced repetition</p>
		<h1>Daily Review</h1>
		<p class="standfirst">
			Type the sound. The clock grades you — a slow correct answer comes back sooner than a
			fast one, because hesitation is the honest signal.
		</p>
	</header>

	{#if !progress.durable}
		<div class="warn card">
			<strong>Progress will not be saved.</strong> This browser is blocking storage on this
			origin, so your review history will vanish when you close the tab. Serve the built app
			over HTTP rather than opening the files directly.
		</div>
	{/if}

	<div class="strip">
		<div class="stat" class:hot={stats.queue > 0}><b>{stats.queue}</b><span>to review</span></div>
		<div class="stat"><b>{stats.mature}</b><span>mastered</span></div>
		<div class="stat"><b>{stats.seen}</b><span>started</span></div>
		<div class="stat"><b>{stats.streak}</b><span>day streak</span></div>
	</div>

	{#if !ready}
		<div class="card empty"><p class="muted">Loading your deck…</p></div>
	{:else if stats.unlocked === 0}
		<div class="card empty" in:fade>
			<span class="big">한</span>
			<h2>Nothing in the deck yet</h2>
			<p>
				Cards unlock as you finish labs, so the deck never quizzes you on something you have
				not met. Finish Lab 01 and {LABS[0].steps.length > 0 ? 19 : 0} consonants drop in.
			</p>
			<a class="btn" href="/lab/0001">Start Lab 01</a>
		</div>
	{:else if finishedSession}
		<div class="card empty" in:fade>
			<span class="big">{right / Math.max(shown, 1) >= 0.8 ? '좋아' : '또'}</span>
			<h2>{right} of {shown} first time</h2>
			<p>
				{#if right / Math.max(shown, 1) >= 0.9}
					That deck is in good shape. The gaps will stretch out on their own.
				{:else if right / Math.max(shown, 1) >= 0.6}
					The ones you missed are already re-queued for a shorter gap. That is the system
					working, not you failing.
				{:else}
					A rough round means the material is still fresh, not that it is lost — missed cards
					come back fast on purpose.
				{/if}
			</p>
			<button class="btn" onclick={start}>Check for more</button>
		</div>
	{:else if queue.length === 0}
		<div class="card empty" in:fade>
			<span class="big">쉬어</span>
			<h2>Deck clear</h2>
			<p>Nothing is due. The next card comes back <strong>{whenNext}</strong>.</p>
			<p class="muted tiny">
				Reviewing early would only weaken the spacing — the gap is doing the work.
				{#if stats.newLeft === 0 && stats.unseen > 0}
					You have also hit today’s cap of {DEFAULT_NEW_PER_DAY} new cards, which keeps sessions short.
				{/if}
			</p>
		</div>
	{:else}
		{#key index}
			<div class="card review" in:fly={{ y: 10, duration: 220 }}>
				<div class="bar"><i style="width:{(index / queue.length) * 100}%"></i></div>

				<p class="tag" class:isnew={!progress.state.cards[card.id]}>
					{progress.state.cards[card.id] ? 'review' : 'new card'} · {index + 1} of {queue.length}
				</p>

				<div class="glyph">{card.front}</div>
				<p class="ask">{card.ask}</p>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						submit();
					}}
				>
					<div class="field">
						<input
							bind:this={input}
							bind:value={typed}
							class="in"
							class:right={verdict?.ok}
							class:wrong={verdict && !verdict.ok}
							disabled={answered}
							type="text"
							inputmode="text"
							autocapitalize="off"
							autocorrect="off"
							spellcheck="false"
							placeholder="type the romanisation"
							aria-label="your answer"
							aria-describedby={emptyHint ? 'empty-hint' : undefined}
							aria-invalid={emptyHint ? true : undefined}
							oninput={() => {
								emptyHint = false;
							}}
						/>
						{#if emptyHint}
							<p id="empty-hint" class="empty-hint" role="status">
								Type a romanisation, then Check.
							</p>
						{/if}
					</div>
					<button class="btn" type="submit">{answered ? 'Next' : 'Check'}</button>
				</form>

				{#if verdict}
					<div
						class="fb"
						data-tone={verdict.ok ? 'right' : 'wrong'}
						in:fade={{ duration: 150 }}
						aria-live="polite"
						aria-atomic="true"
					>
						<span class="v">{verdict.ok ? `Correct · ${verdict.speed}` : 'Missed'}</span>
						<span class="ans">
							{card.answers[0]}
							{#if card.answers.length > 1}
								<em>also: {card.answers.slice(1).join(', ')}</em>
							{/if}
						</span>
						<span class="note">{card.note}</span>
						<span class="sched">{verdict.ok ? '' : 'reset — '}{verdict.when}</span>
					</div>
					<div class="foot">
						<button class="btn" onclick={next}>Next</button>
						<span class="kb">or press Enter</span>
					</div>
				{/if}
			</div>
		{/key}
	{/if}
</div>

<style>
	.narrow { max-width: 40rem; }
	.head { margin-bottom: var(--s5); }
	h1 { margin: var(--s2) 0 var(--s3); }
	.standfirst {
		font-family: var(--serif);
		font-style: italic;
		font-size: 1.05rem;
		color: var(--ink-soft);
		margin: 0;
	}

	.warn {
		border-color: var(--bad);
		background: var(--bad-soft);
		padding: var(--s3) var(--s4);
		margin-bottom: var(--s4);
		font-size: 0.86rem;
		line-height: 1.55;
	}

	.strip {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(6rem, 1fr));
		gap: var(--s2);
		margin-bottom: var(--s5);
	}
	.stat {
		border: 1px solid var(--rule);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		padding: var(--s3) var(--s2);
		text-align: center;
	}
	.stat.hot { border-color: var(--accent); background: var(--accent-soft); }
	.stat.hot b { color: var(--accent); }
	.stat b {
		font-family: var(--mono);
		font-size: 1.35rem;
		display: block;
		font-variant-numeric: tabular-nums;
	}
	.stat span {
		font-size: 0.58rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}

	.review { padding: var(--s5); }

	.bar {
		height: 3px;
		background: var(--rule);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: var(--s4);
	}
	.bar i { display: block; height: 100%; background: var(--accent); transition: width var(--med) var(--ease); }

	.tag {
		text-align: center;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--accent);
		margin: 0;
	}
	.tag.isnew { color: var(--blue); }

	.glyph {
		font-family: var(--hangul);
		font-size: 6.5rem;
		font-weight: 500;
		line-height: 1.05;
		text-align: center;
		margin: var(--s3) 0 var(--s2);
	}

	.ask { text-align: center; font-size: 0.84rem; color: var(--ink-soft); margin: 0 0 var(--s4); }

	form { display: flex; gap: var(--s2); align-items: flex-start; }

	.field {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--s1);
	}

	.empty-hint {
		margin: 0;
		font-size: 0.82rem;
		color: var(--ink);
	}

	.in {
		width: 100%;
		border: 1px solid var(--rule-strong);
		border-radius: var(--r-md);
		background: var(--paper-sunk);
		color: var(--ink);
		font-family: var(--mono);
		font-size: 1.15rem;
		padding: 0.7rem 0.9rem;
	}
	.in.right { border-color: var(--good); background: var(--good-soft); color: var(--good); }
	.in.wrong { border-color: var(--bad); background: var(--bad-soft); color: var(--bad); }

	.fb {
		margin-top: var(--s4);
		padding: var(--s3) var(--s4);
		border-radius: var(--r-md);
		border-left: 3px solid var(--rule-strong);
		background: var(--paper-sunk);
		font-size: 0.87rem;
		line-height: 1.6;
	}
	.fb[data-tone='right'] { border-left-color: var(--good); background: var(--good-soft); }
	.fb[data-tone='wrong'] { border-left-color: var(--bad); background: var(--bad-soft); }

	.v {
		display: block;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: var(--s1);
	}
	.fb[data-tone='right'] .v { color: var(--good); }
	.fb[data-tone='wrong'] .v { color: var(--bad); }

	.ans { display: block; font-family: var(--mono); font-size: 1.05rem; margin-bottom: var(--s1); }
	.ans em { font-size: 0.78rem; opacity: 0.6; font-style: normal; }
	.note { display: block; color: var(--ink-soft); }
	.sched {
		display: block;
		margin-top: var(--s2);
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--ink-faint);
	}

	.foot { margin-top: var(--s3); display: flex; align-items: center; gap: var(--s3); }
	.kb { font-size: 0.7rem; color: var(--ink-faint); margin-left: auto; }

	.empty { padding: var(--s7) var(--s5); text-align: center; }
	.empty .big { font-family: var(--hangul); font-size: 3.2rem; display: block; margin-bottom: var(--s3); }
	.empty h2 { margin-bottom: var(--s2); }
	.empty p { color: var(--ink-soft); font-size: 0.92rem; max-width: 28rem; margin: 0 auto var(--s4); }
</style>
