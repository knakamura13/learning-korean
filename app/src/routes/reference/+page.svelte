<script lang="ts">
	import { onMount } from 'svelte';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import KoText from '$lib/components/KoText.svelte';
	import VocabPacks from '$lib/components/VocabPacks.svelte';
	import ReferenceIndexRail from '$lib/components/shell/ReferenceIndexRail.svelte';
	import {
		LEADS, VOWELS, REPRESENTATIVE, CLUSTERS, SOUND_CHANGES, BLOCK_LAYOUTS,
		GANADA_CONSONANTS, GANADA_VOWELS, CLUSTER_EXCEPTIONS, BASE_SHAPES,
		batchimSound, clusterParts, clusterRule, fusionParts, mergedWith, harmony,
		derive, baseShapeOf
	} from '$lib/domain/hangul';
	import {
		jumpScrollY,
		pickActiveSection,
		referenceJumpOffset,
		REFERENCE_SECTIONS,
		shouldReleaseJumpPin,
		type SectionHit
	} from '$lib/domain/referenceNav';
	import { progress } from '$lib/stores/progress.svelte';

	/** The five families, rebuilt from the derivation map rather than listed. */
	const FAMILIES = BASE_SHAPES.map((base) => ({
		base,
		members: LEADS.filter((c) => baseShapeOf(c) === base)
	}));

	const FAMILY_NAMES: Record<string, string> = {
		'ㄱ': 'velar · 아음',
		'ㄴ': 'alveolar · 설음',
		'ㅁ': 'labial · 순음',
		'ㅅ': 'sibilant · 치음',
		'ㅇ': 'guttural · 후음'
	};

	// The reference is generated from the same module the labs use, so it can
	// never fall out of date with what the app actually teaches.
	const COMPOUNDS = ['ㅐ', 'ㅒ', 'ㅔ', 'ㅖ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'];
	const SIMPLE = VOWELS.filter((v) => !COMPOUNDS.includes(v));

	const NAMES: Record<string, string> = {
		'ㄱ': '기역', 'ㄲ': '쌍기역', 'ㄴ': '니은', 'ㄷ': '디귿', 'ㄸ': '쌍디귿',
		'ㄹ': '리을', 'ㅁ': '미음', 'ㅂ': '비읍', 'ㅃ': '쌍비읍', 'ㅅ': '시옷',
		'ㅆ': '쌍시옷', 'ㅇ': '이응', 'ㅈ': '지읒', 'ㅉ': '쌍지읒', 'ㅊ': '치읓',
		'ㅋ': '키읔', 'ㅌ': '티읕', 'ㅍ': '피읖', 'ㅎ': '히읗'
	};

	let activeSection = $state<string | null>(null);
	let pinnedSection = $state<string | null>(null);
	let lastHits: SectionHit[] = [];
	let ready = $state(false);

	const packs = $derived(progress.vocabProgress);
	const vocabOpenable = $derived(progress.isUnlocked('lab05'));

	onMount(() => {
		progress.tick();
		ready = true;
	});

	$effect(() => {
		const hits = new Map<string, SectionHit>();
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					hits.set(entry.target.id, {
						id: entry.target.id,
						ratio: entry.intersectionRatio,
						top: entry.boundingClientRect.top
					});
				}
				lastHits = [...hits.values()];
				activeSection = pickActiveSection(lastHits, activeSection, pinnedSection);
			},
			{
				rootMargin: '-72px 0px -50% 0px',
				threshold: [0, 0.15, 0.4, 0.75, 1]
			}
		);
		for (const section of REFERENCE_SECTIONS) {
			const el = document.getElementById(section.id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	});

	function railBottom(): number | null {
		const rail = document.querySelector('.ref-index');
		if (!(rail instanceof HTMLElement)) return null;
		return rail.getBoundingClientRect().bottom;
	}

	function jumpToSection(id: string, event: MouseEvent) {
		pinnedSection = id;
		activeSection = id;
		const el = document.getElementById(id);
		if (!el) return;
		event.preventDefault();
		history.replaceState(null, '', `#${id}`);
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const offset = referenceJumpOffset(window.innerWidth, railBottom());
		window.scrollTo({
			top: jumpScrollY(el.getBoundingClientRect().top, window.scrollY, offset),
			behavior: reduce ? 'auto' : 'smooth'
		});
		const heading = el.querySelector<HTMLElement>('h2.sec');
		heading?.focus({ preventScroll: true });
	}

	function releaseJumpPin() {
		if (!shouldReleaseJumpPin('user')) return;
		if (!pinnedSection) return;
		pinnedSection = null;
		activeSection = pickActiveSection(lastHits, activeSection, null);
	}

	function onWindowKey(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
			case 'ArrowUp':
			case 'PageDown':
			case 'PageUp':
			case 'Home':
			case 'End':
			case ' ':
				releaseJumpPin();
				return;
			default:
				return;
		}
	}

	const SOUND: Record<string, string> = {
		'ㄱ': 'g', 'ㄲ': 'kk', 'ㄴ': 'n', 'ㄷ': 'd', 'ㄸ': 'tt', 'ㄹ': 'r', 'ㅁ': 'm',
		'ㅂ': 'b', 'ㅃ': 'pp', 'ㅅ': 's', 'ㅆ': 'ss', 'ㅇ': '—', 'ㅈ': 'j', 'ㅉ': 'jj',
		'ㅊ': 'ch', 'ㅋ': 'k', 'ㅌ': 't', 'ㅍ': 'p', 'ㅎ': 'h',
		'ㅏ': 'a', 'ㅑ': 'ya', 'ㅓ': 'eo', 'ㅕ': 'yeo', 'ㅗ': 'o', 'ㅛ': 'yo',
		'ㅜ': 'u', 'ㅠ': 'yu', 'ㅡ': 'eu', 'ㅣ': 'i',
		'ㅐ': 'ae', 'ㅒ': 'yae', 'ㅔ': 'e', 'ㅖ': 'ye', 'ㅘ': 'wa', 'ㅙ': 'wae',
		'ㅚ': 'oe', 'ㅝ': 'wo', 'ㅞ': 'we', 'ㅟ': 'wi', 'ㅢ': 'ui'
	};
</script>

<svelte:head><title>Reference — every letter and rule</title></svelte:head>
<svelte:window onwheel={releaseJumpPin} ontouchstart={releaseJumpPin} onkeydown={onWindowKey} />

<div class="with-rail">
	<div class="shell">
	<header class="head">
		<h1>Every letter and rule</h1>
		<p class="lede">
			Generated from the same module the labs run on, so it cannot drift from what the app
			teaches. First-use terms:
			<abbr title="Final consonant slot at the bottom of a syllable block (받침)">batchim</abbr>,
			<abbr title="Batchim moving into the next syllable when it begins with placeholder ㅇ (연음)">liaison</abbr>,
			and deck
			<abbr title="A gated review slice unlocked by finishing a lab">tiers</abbr>
			are expanded here; lesson prose defines them in context.
		</p>
	</header>

	<div class="page">
	<VocabPacks {packs} {ready} openable={vocabOpenable} />

	<section id="consonants" aria-labelledby="sec-consonants-heading">
		<h2 id="sec-consonants-heading" class="sec" tabindex="-1">19 consonants</h2>
		<ul class="grid">
			{#each LEADS as c (c)}
				<li class="cell">
					<span class="big" lang="ko">{c}</span>
					<span class="rom2">{SOUND[c]}</span>
					<span class="nm" lang="ko">{NAMES[c]}</span>
					<span class="fin">final: <KoText text={batchimSound(c) || '—'} /></span>
					<div class="hear">
						<PlayButton jamo={c} audioSlot="lead" />
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section id="simple-vowels" aria-labelledby="sec-simple-vowels-heading">
		<h2 id="sec-simple-vowels-heading" class="sec" tabindex="-1">10 simple vowels</h2>
		<ul class="grid">
			{#each SIMPLE as v (v)}
				<li class="cell">
					<span class="big" lang="ko">{v}</span>
					<span class="rom2">{SOUND[v]}</span>
					<span class="nm">{harmony(v)}</span>
					<div class="hear">
						<PlayButton jamo={v} audioSlot="vowel" />
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section id="compound-vowels" aria-labelledby="sec-compounds-heading">
		<h2 id="sec-compounds-heading" class="sec" tabindex="-1">11 compound vowels</h2>
		<ul class="grid">
			{#each COMPOUNDS as v (v)}
				{@const parts = fusionParts(v)}
				{@const merged = mergedWith(v)}
				<li class="cell">
					<span class="big" lang="ko">{v}</span>
					<span class="rom2">{SOUND[v]}</span>
					<span class="nm"><KoText text={parts ? `${parts[0]} + ${parts[1]}` : ''} /></span>
					{#if merged.length}<span class="fin">= <KoText text={merged.join(' ')} /></span>{/if}
					<div class="hear">
						<PlayButton jamo={v} audioSlot="vowel" />
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section id="batchim" aria-labelledby="sec-batchim-heading">
		<h2 id="sec-batchim-heading" class="sec" tabindex="-1">
			<abbr title="Final consonant slot at the bottom of a syllable block (받침)">Batchim</abbr>
			— 27 finals, 7 sounds
		</h2>
		<div class="rows card">
			{#each REPRESENTATIVE as r (r)}
				<div class="row">
					<span class="key hg" lang="ko">{r}</span>
					<div class="hear">
						<PlayButton jamo={r} audioSlot="final" />
					</div>
					<span class="vals hg" lang="ko">
						{['ㄱ','ㄲ','ㅋ','ㄳ','ㄺ','ㄴ','ㄵ','ㄶ','ㄷ','ㅅ','ㅆ','ㅈ','ㅊ','ㅌ','ㅎ','ㄹ','ㄼ','ㄽ','ㄾ','ㅀ','ㅁ','ㄻ','ㅂ','ㅍ','ㄿ','ㅄ','ㅇ']
							.filter((f) => batchimSound(f) === r)
							.join('  ')}
					</span>
				</div>
			{/each}
		</div>
	</section>

	<section id="clusters" aria-labelledby="sec-clusters-heading">
		<h2 id="sec-clusters-heading" class="sec" tabindex="-1">11 clusters</h2>
		<div class="rows card">
			{#each CLUSTERS as c (c)}
				{@const parts = clusterParts(c)}
				<div class="row">
					<span class="key hg" lang="ko">{c}</span>
					<div class="hear">
						<PlayButton jamo={c} audioSlot="final" />
					</div>
					<span class="vals">
						<span class="hg"><KoText text={parts ? `${parts[0]} + ${parts[1]}` : ''} /></span>
						<span class="arrow">→</span>
						<span class="hg win" lang="ko">{batchimSound(c)}</span>
						<span class="rule">
							<KoText
								text={clusterRule(c) === 'first'
									? 'first letter wins'
									: clusterRule(c) === 'second'
										? 'second letter wins'
										: 'ㅎ aspirates what follows'}
							/>
						</span>
					</span>
				</div>
			{/each}
		</div>
		<div class="note card">
			<h3>Named exceptions</h3>
			<p class="muted tiny">
				Lexical, not derivable — named exceptions in standard pronunciation.
			</p>
			{#each CLUSTER_EXCEPTIONS as ex (ex.example)}
				<div class="exrow">
					<span class="hg" lang="ko">{ex.example}</span>
					<span class="arrow">→</span>
					<span class="hg win" lang="ko">[{ex.pron}]</span>
					<span class="rule"><KoText text={ex.note} /></span>
				</div>
			{/each}
		</div>
	</section>

	<section id="derivation" aria-labelledby="sec-derivation-heading">
		<h2 id="sec-derivation-heading" class="sec" tabindex="-1">The derivation map</h2>
		<p class="lede tiny muted">
			Five shapes drawn from the articulators; a stroke adds breath, doubling adds tension.
			Rebuilt here from the same map the labs use.
		</p>
		<div class="rows card">
			{#each FAMILIES as fam (fam.base)}
				<div class="row">
					<span class="key hg" lang="ko">{fam.base}</span>
					<span class="vals">
						<span class="hg" lang="ko">{fam.members.join('  ')}</span>
						<span class="rule"><KoText text={FAMILY_NAMES[fam.base]} /></span>
					</span>
				</div>
			{/each}
		</div>
	</section>

	<section id="block-layouts" aria-labelledby="sec-layouts-heading">
		<h2 id="sec-layouts-heading" class="sec" tabindex="-1">Block layouts</h2>
		<div class="rows card">
			{#each BLOCK_LAYOUTS as l (l.kind)}
				<div class="row wrap">
					<span class="lkind">{l.kind}</span>
					<span class="vals">
						<span class="hg small"><KoText text={l.vowels} /></span>
						<span class="rule">{l.rule}</span>
					</span>
					<span class="hg ex" lang="ko">{l.examples}</span>
				</div>
			{/each}
		</div>
	</section>

	<section id="sound-changes" aria-labelledby="sec-sound-changes-heading">
		<h2 id="sec-sound-changes-heading" class="sec" tabindex="-1">The eight sound changes</h2>
		<p class="lede tiny muted">
			Korean spelling preserves what a word <em>is</em>; these rules are how it sounds. They
			are the roadmap for everything after Lab 05.
		</p>
		<div class="rows card">
			{#each SOUND_CHANGES as sc (sc.id)}
				<div class="row wrap">
					<span class="scname">
						<KoText text={sc.name} />
						<em class="hg" lang="ko">{sc.korean}</em>
						{#if !sc.scored}
							<span class="muted tiny">not scored yet</span>
						{/if}
					</span>
					<span class="vals">
						<span class="rule wide"><KoText text={sc.trigger} /></span>
						<span class="exs">
							{#each sc.examples as ex (ex.written)}
								<span class="pair">
									<span class="hg" lang="ko">{ex.written}</span>
									<span class="arrow">→</span>
									<span class="hg win" lang="ko">[{ex.spoken}]</span>
								</span>
							{/each}
						</span>
					</span>
				</div>
			{/each}
		</div>
	</section>

	<section id="dictionary-order" aria-labelledby="sec-ganada-heading">
		<h2 id="sec-ganada-heading" class="sec" tabindex="-1">Dictionary order (<span lang="ko">가나다순</span>)</h2>
		<div class="card ganada">
			<p class="glabel">consonants</p>
			<p class="hg grow" lang="ko">{GANADA_CONSONANTS.join(' ')}</p>
			<p class="glabel">vowels</p>
			<p class="hg grow" lang="ko">{GANADA_VOWELS.join(' ')}</p>
			<p class="muted tiny">
				South Korean order. The name <em>ganada</em> is itself the order:
				<KoText text="ㄱ, ㄴ, ㄷ" /> each on <span lang="ko">ㅏ</span>.
			</p>
		</div>
	</section>

	<section id="sources" aria-labelledby="sec-sources-heading">
		<h2 id="sec-sources-heading" class="sec" tabindex="-1">Sources</h2>
		<ul class="src">
			<li>
				<a href="https://www.korean.go.kr/"
					>National Institute of Korean Language (<span lang="ko">국립국어원</span>)</a
				>
				— the language regulator; publisher of the Standard Pronunciation Rules
				(<span lang="ko">표준 발음법</span>, pyojun bareumbeop) that govern the batchim, cluster and sound-change
				sections above.
			</li>
			<li>
				<a href="https://www.tufs.ac.jp/ts/personal/choes/korean/nanboku/bareumbeop.html"
					><span lang="ko">표준 발음법</span> (pyojun bareumbeop), full text</a
				>
				— standard pronunciation rules full text for clusters and sound changes.
			</li>
			<li>
				<a href="https://www.koreascience.kr/article/JAKO202225852210743.page">“Hunminjeongeum Phonetics (II)”</a>
				— peer-reviewed assessment of the articulatory rationale behind the letter shapes.
			</li>
			<li>
				<a href="https://www.howtostudykorean.com/unit0/unit-0-lesson-1/">How To Study Korean, Unit 0</a>
				— free, with native audio for every letter. This app ships isolated letter
				clips (leads, vowels, neutralized finals); word-level audio is still ahead.
			</li>
		</ul>
	</section>
	</div>
	</div>
	<ReferenceIndexRail activeId={activeSection} onJump={jumpToSection} />
</div>

<style>
	.with-rail {
		display: grid;
		grid-template-areas:
			'head'
			'rail'
			'main';
		max-width: var(--shell);
		margin-inline: auto;
		padding-top: var(--s6);
		padding-bottom: max(var(--s8), env(safe-area-inset-bottom));
		padding-inline: max(var(--s5), env(safe-area-inset-left)) max(var(--s5), env(safe-area-inset-right));
	}
	.with-rail .shell {
		display: contents;
	}
	.with-rail .head {
		grid-area: head;
	}
	.with-rail .page {
		grid-area: main;
		min-width: 0;
	}
	.with-rail :global(.ref-index) {
		grid-area: rail;
	}

	@media (max-width: 40rem) {
		.with-rail {
			padding-top: var(--s5);
			padding-bottom: max(var(--s7), env(safe-area-inset-bottom));
			padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
		}
	}

	@media (min-width: 72rem) {
		section {
			scroll-margin-block-start: calc(48px + env(safe-area-inset-top) + var(--s3));
		}
		.with-rail {
			grid-template-areas:
				'rail head'
				'rail main';
			grid-template-columns: max-content minmax(0, 1fr);
			column-gap: var(--s4);
			padding-inline: max(var(--s4), env(safe-area-inset-left)) max(var(--s4), env(safe-area-inset-right));
		}
	}

	.head { margin-bottom: var(--s4); max-width: var(--measure); }
	h1 { margin: var(--s2) 0 var(--s3); }
	.lede { color: var(--ink-soft); max-width: var(--measure); }

	section {
		margin-bottom: var(--s7);
		scroll-margin-block-start: calc(48px + env(safe-area-inset-top) + 12.5rem);
	}

	/* Last block is short; without leftover viewport, #dictionary-order cannot
	   settle under the sticky bar (other jumps already land ~85px). */
	#sources {
		min-height: calc(100lvh - (var(--s7) + 2rem));
	}

	.sec {
		font-family: var(--sans);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin: 0 0 var(--s3);
	}

	.grid {
		display: grid;
		gap: var(--s2);
		grid-template-columns: repeat(auto-fill, minmax(6.4rem, 1fr));
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.cell {
		border: 1px solid var(--rule);
		border-radius: var(--r-md);
		background: var(--paper-raised);
		padding: var(--s3) var(--s2);
		text-align: center;
	}
	.cell .big {
		font-family: var(--hangul);
		font-size: 2.1rem;
		font-weight: 500;
		line-height: 1.05;
		display: block;
	}
	.cell .rom2 {
		font-family: var(--mono);
		font-size: 0.76rem;
		color: var(--accent);
		display: block;
		margin-top: var(--s1);
	}
	.cell .nm, .cell .fin {
		font-size: 0.75rem;
		color: var(--ink-faint);
		display: block;
	}
	.cell .hear {
		display: flex;
		justify-content: center;
		margin-top: var(--s2);
	}
	.row .hear {
		flex: 0 0 auto;
	}

	.rows { padding: var(--s2) var(--s4); }
	.row {
		display: flex;
		align-items: center;
		gap: var(--s4);
		padding: var(--s2) 0;
		border-bottom: 1px solid var(--rule);
	}
	.row:last-child { border-bottom: none; }

	.key {
		flex: 0 0 2.4rem;
		font-size: 1.6rem;
		font-weight: 600;
		color: var(--accent);
	}
	.vals { font-size: 1.05rem; display: flex; align-items: center; gap: var(--s2); flex-wrap: wrap; }
	.vals .win { color: var(--good); font-weight: 600; }
	.arrow { color: var(--ink-faint); font-size: 0.8rem; }
	.rule {
		font-size: 0.75rem;
		color: var(--ink-faint);
		font-family: var(--sans);
		margin-inline-start: var(--s2);
	}
	.rule.wide { margin-inline-start: 0; display: block; margin-bottom: var(--s1); }

	.row.wrap { align-items: flex-start; flex-wrap: wrap; }
	.row.wrap .vals { flex: 1 1 18rem; flex-direction: column; align-items: flex-start; gap: var(--s1); }

	.lkind, .scname {
		flex: 0 1 9rem;
		min-width: 0;
		font-size: 0.8rem;
		font-weight: 600;
	}
	.scname em { display: block; font-style: normal; font-size: 0.9rem; color: var(--ink-faint); }
	.hg.small { font-size: 0.95rem; }
	.hg.ex { font-size: 1.2rem; color: var(--ink-soft); }

	.exs { display: flex; gap: var(--s4); flex-wrap: wrap; }
	.pair { display: inline-flex; align-items: center; gap: var(--s1); font-size: 1.05rem; }

	.note { margin-top: var(--s3); padding: var(--s4); }
	.note h3 { font-size: 0.95rem; margin-bottom: var(--s1); }
	.exrow {
		display: flex;
		align-items: center;
		gap: var(--s2);
		flex-wrap: wrap;
		padding: var(--s2) 0;
		border-bottom: 1px solid var(--rule);
		font-size: 1.05rem;
	}
	.exrow:last-child { border-bottom: none; }

	.ganada { padding: var(--s4); }
	.glabel {
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-faint);
		margin: 0 0 var(--s1);
	}
	.grow {
		font-size: 1.35rem;
		letter-spacing: 0.1em;
		line-height: 1.6;
		margin: 0 0 var(--s3);
		overflow-wrap: anywhere;
	}

	.src { margin: 0; padding-inline-start: 1.1rem; font-size: 0.86rem; line-height: 1.6; color: var(--ink-soft); max-width: var(--measure); }
	.src li { margin-bottom: var(--s2); }
	.src a {
		display: inline-flex;
		align-items: center;
		min-width: 44px;
		min-height: 44px;
	}
</style>
