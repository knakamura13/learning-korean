<script lang="ts">
	import PlayButton from '$lib/components/PlayButton.svelte';
	import KoText from '$lib/components/KoText.svelte';
	import {
		LEADS, VOWELS, REPRESENTATIVE, CLUSTERS, SOUND_CHANGES, BLOCK_LAYOUTS,
		GANADA_CONSONANTS, GANADA_VOWELS, CLUSTER_EXCEPTIONS, BASE_SHAPES,
		batchimSound, clusterParts, clusterRule, fusionParts, mergedWith, harmony,
		derive, baseShapeOf
	} from '$lib/domain/hangul';

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

<div class="shell">
	<header class="head">
		<p class="eyebrow">Reference</p>
		<h1>Every letter and rule</h1>
		<p class="lede">
			Generated from the same module the labs run on, so it cannot drift from what the app
			teaches.
		</p>
		<p class="quick-nav-label">Jump to section</p>
		<nav class="quick-nav" aria-label="Reference sections">
			<a href="#consonants">19 Consonants</a>
			<a href="#simple-vowels">10 Simple Vowels</a>
			<a href="#compound-vowels">11 Compounds</a>
			<a href="#batchim">Batchim (7 Sounds)</a>
			<a href="#clusters">11 Clusters</a>
			<a href="#derivation">Derivation Map</a>
			<a href="#block-layouts">Block Layouts</a>
			<a href="#sound-changes">Sound Changes</a>
			<a href="#dictionary-order">Dictionary Order</a>
		</nav>
	</header>

	<section id="consonants" aria-labelledby="sec-consonants-heading">
		<h2 id="sec-consonants-heading" class="sec">19 consonants</h2>
		<div class="grid">
			{#each LEADS as c (c)}
				<div class="cell">
					<span class="big" lang="ko">{c}</span>
					<span class="rom2">{SOUND[c]}</span>
					<span class="nm" lang="ko">{NAMES[c]}</span>
					<span class="fin">final: {batchimSound(c) || '—'}</span>
					<div class="hear">
						<PlayButton jamo={c} />
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section id="simple-vowels" aria-labelledby="sec-simple-vowels-heading">
		<h2 id="sec-simple-vowels-heading" class="sec">10 simple vowels</h2>
		<div class="grid">
			{#each SIMPLE as v (v)}
				<div class="cell">
					<span class="big" lang="ko">{v}</span>
					<span class="rom2">{SOUND[v]}</span>
					<span class="nm">{harmony(v)}</span>
				</div>
			{/each}
		</div>
	</section>

	<section id="compound-vowels" aria-labelledby="sec-compounds-heading">
		<h2 id="sec-compounds-heading" class="sec">11 compound vowels</h2>
		<div class="grid">
			{#each COMPOUNDS as v (v)}
				{@const parts = fusionParts(v)}
				{@const merged = mergedWith(v)}
				<div class="cell">
					<span class="big" lang="ko">{v}</span>
					<span class="rom2">{SOUND[v]}</span>
					<span class="nm"><KoText text={parts ? `${parts[0]} + ${parts[1]}` : ''} /></span>
					{#if merged.length}<span class="fin">= <KoText text={merged.join(' ')} /></span>{/if}
				</div>
			{/each}
		</div>
	</section>

	<section id="batchim" aria-labelledby="sec-batchim-heading">
		<h2 id="sec-batchim-heading" class="sec">Batchim — 27 finals, 7 sounds</h2>
		<div class="rows card">
			{#each REPRESENTATIVE as r (r)}
				<div class="row">
					<span class="key hg" lang="ko">{r}</span>
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
		<h2 id="sec-clusters-heading" class="sec">11 clusters</h2>
		<div class="rows card">
			{#each CLUSTERS as c (c)}
				{@const parts = clusterParts(c)}
				<div class="row">
					<span class="key hg" lang="ko">{c}</span>
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
				Lexical, not derivable — written into the Standard Pronunciation Rules by name.
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
		<h2 id="sec-derivation-heading" class="sec">The derivation map</h2>
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
		<h2 id="sec-layouts-heading" class="sec">Block layouts</h2>
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
		<h2 id="sec-sound-changes-heading" class="sec">The eight sound changes</h2>
		<p class="lede tiny muted">
			Korean spelling preserves what a word <em>is</em>; these rules are how it sounds. They
			are the roadmap for everything after Lab 05.
		</p>
		<div class="rows card">
			{#each SOUND_CHANGES as sc (sc.id)}
				<div class="row wrap">
					<span class="scname">
						{sc.name}
						<em class="hg" lang="ko">{sc.korean}</em>
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
		<h2 id="sec-ganada-heading" class="sec">Dictionary order (<span lang="ko">가나다순</span>)</h2>
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
		<h2 id="sec-sources-heading" class="sec">Sources</h2>
		<ul class="src">
			<li>
				<a href="https://www.korean.go.kr/"
					>National Institute of Korean Language (<span lang="ko">국립국어원</span>)</a
				>
				— the language regulator; publisher of the 1988 Standard Pronunciation Rules
				(<span lang="ko">표준 발음법</span>) that govern the batchim, cluster and sound-change
				sections above.
			</li>
			<li>
				<a href="https://www.tufs.ac.jp/ts/personal/choes/korean/nanboku/bareumbeop.html"
					><span lang="ko">표준 발음법</span>, full text</a
				>
				— Articles 10 and 11 are the source for the cluster rules and their exceptions.
			</li>
			<li>
				<a href="https://www.koreascience.kr/article/JAKO202225852210743.page">“Hunminjeongeum Phonetics (II)”</a>
				— peer-reviewed assessment of the articulatory rationale behind the letter shapes.
			</li>
			<li>
				<a href="https://www.howtostudykorean.com/unit0/unit-0-lesson-1/">How To Study Korean, Unit 0</a>
				— free, with native audio for every letter. This app now ships a first slice of
				isolated consonant clips; vowel and batchim audio are still ahead.
			</li>
		</ul>
	</section>
</div>

<style>
	.head { margin-bottom: var(--s6); max-width: var(--measure); }
	h1 { margin: var(--s2) 0 var(--s3); }
	.lede { color: var(--ink-soft); }

	.quick-nav-label {
		margin: var(--s4) 0 var(--s1);
		color: var(--ink-faint);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.quick-nav {
		display: flex;
		gap: var(--s2);
		flex-wrap: wrap;
		padding: var(--s2) 0;
	}
	.quick-nav a {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0.25rem 0.65rem;
		border-radius: var(--r-pill);
		background: var(--paper-sunk);
		border: 1px solid var(--rule);
		font-size: 0.74rem;
		font-weight: 500;
		text-decoration: none;
		color: var(--ink-soft);
		white-space: nowrap;
		transition: background var(--fast) var(--ease), border-color var(--fast) var(--ease),
			color var(--fast) var(--ease);
	}
	.quick-nav a:hover {
		background: var(--paper-raised);
		border-color: var(--accent);
		color: var(--accent);
	}
	.quick-nav a:active {
		transform: translateY(1px);
	}

	@media (max-width: 40rem) {
		.quick-nav {
			flex-wrap: nowrap;
			overflow-x: auto;
			overscroll-behavior-inline: contain;
			scroll-padding-inline: var(--s2);
			scroll-snap-type: inline proximity;
			scrollbar-color: var(--rule) transparent;
			scrollbar-width: thin;
			-webkit-overflow-scrolling: touch;
			mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 2rem), transparent);
			padding-inline-end: 2rem;
		}
		.quick-nav a {
			flex: 0 0 auto;
			scroll-snap-align: start;
		}
		.quick-nav::-webkit-scrollbar {
			height: 0.35rem;
		}
		.quick-nav::-webkit-scrollbar-thumb {
			border-radius: var(--r-pill);
			background: var(--rule);
		}
	}

	section {
		margin-bottom: var(--s7);
		scroll-margin-top: calc(var(--s7) + 2rem);
	}

	/* Last block is short; without leftover viewport, #dictionary-order cannot
	   settle under the sticky bar (other jumps already land ~85px). */
	#sources {
		min-height: calc(100dvh - (var(--s7) + 2rem));
	}

	.sec {
		font-family: var(--sans);
		font-size: 0.66rem;
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
		font-size: 0.6rem;
		color: var(--ink-faint);
		display: block;
	}
	.cell .hear {
		display: flex;
		justify-content: center;
		margin-top: var(--s2);
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
		font-size: 0.68rem;
		color: var(--ink-faint);
		font-family: var(--sans);
		margin-inline-start: var(--s2);
	}
	.rule.wide { margin-inline-start: 0; display: block; margin-bottom: var(--s1); }

	.row.wrap { align-items: flex-start; flex-wrap: wrap; }
	.row.wrap .vals { flex: 1 1 18rem; flex-direction: column; align-items: flex-start; gap: var(--s1); }

	.lkind, .scname {
		flex: 0 0 9rem;
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
		font-size: 0.6rem;
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

	.src { margin: 0; padding-inline-start: 1.1rem; font-size: 0.86rem; line-height: 1.6; color: var(--ink-soft); }
	.src li { margin-bottom: var(--s2); }
	.src a {
		display: inline-flex;
		align-items: center;
		min-width: 44px;
		min-height: 44px;
	}
</style>
