import type { Lab } from './types';

export const lab05: Lab = {
	id: '0005',
	number: 5,
	title: 'Two Letters, One Slot',
	standfirst:
		'Eleven times, Korean crams two consonants into the bottom of a block and pronounces only one of them. This is the last structural piece of the writing system — and the only part you genuinely have to memorize.',
	minutes: 10,
	unlocks: 'lab05',
	requires: '0004',
	finish: {
		title: 'The writing system is complete',
		summary:
			'Every letter, every compound, every slot. From here nothing new gets added to the page — what changes is how the page sounds when letters meet each other. Next: liaison, the single rule that does the most to make spoken Korean match what you can already read.'
	},
	phases: [
		{ title: 'Most clusters pronounce the first letter', count: 4 },
		{ title: 'Three clusters drop ㄹ', count: 3 },
		{ title: 'Clusters with ㅎ make the next consonant aspirated', count: 2 },
		{ title: 'Two verb stems break the cluster rules', count: 2 },
		{ title: 'Read from the letters alone', count: 3 },
	],
	steps: [

		/* ---- Most clusters pronounce the first letter ---- */
		{
			type: 'choice',
			do: 'Look at the bottom of the first block. How many consonants are down there?',
			stage: [{ glyph: '없다', caption: 'to not exist' }],
			options: ['1', '2', '3', '4'],
			answer: 1,
			teach:
				'<p>Two: <span class="jamo">ㅂ</span> and <span class="jamo">ㅅ</span>, written side by side as <span class="jamo">ㅄ</span>.</p><p>Korean does this eleven times. But you already know the bottom slot only ever makes <em>one</em> of seven sounds — so one of those two letters has to lose.</p>'
		},
		{
			type: 'cluster',
			do: 'Make the call.',
			word: '없다',
			cluster: 'ㅄ',
			pron: '[업따]',
			gloss: 'to not exist',
			teach:
				'<p>The <strong>first</strong> letter survives; <span class="jamo">ㅅ</span> is simply dropped.</p><p>The <span class="hg">따</span> is a separate rule: after an unreleased stop, a plain consonant tenses. You will formalize that later.</p>'
		},
		{
			type: 'cluster',
			do: 'Same shape, different letters.',
			word: '몫',
			cluster: 'ㄳ',
			pron: '[목]',
			gloss: 'a share, a portion',
			teach: '<p>First letter again. <span class="jamo">ㅅ</span> loses twice in a row.</p>'
		},
		{
			type: 'choice',
			do: 'In both <span class="hg">없다</span> and <span class="hg">몫</span>, which of the two letters was pronounced?',
			stage: [{ glyph: 'ㅄ' }, { glyph: 'ㄳ' }],
			options: ['The first one', 'The second one', 'The louder one', 'The taller one'],
			answer: 0,
			teach:
				'<p><strong>Rule A: the first letter wins.</strong> That covers six of the eleven clusters — <span class="jamo">ㄳ ㄵ ㄼ ㄽ ㄾ ㅄ</span>.</p><p>Now the awkward part.</p>'
		},

		/* ---- Three clusters drop ㄹ ---- */
		{
			type: 'cluster',
			do: 'This one does not follow Rule A. Pick what you actually hear.',
			word: '읽다',
			cluster: 'ㄺ',
			pron: '[익따]',
			gloss: 'to read',
			teach:
				'<p>The <strong>second</strong> letter wins here. <span class="jamo">ㄹ</span> is dropped and <span class="jamo">ㄱ</span> survives.</p>'
		},
		{
			type: 'cluster',
			do: 'Same family. Which one survives?',
			word: '삶',
			cluster: 'ㄻ',
			pron: '[삼]',
			gloss: 'life',
			teach:
				'<p>Second letter again. <span class="jamo">ㄻ</span> → <span class="jamo">ㅁ</span>.</p><p><strong>Rule B: the second letter wins</strong> — for exactly three clusters, <span class="jamo">ㄺ ㄻ ㄿ</span>.</p>'
		},
		{
			type: 'choice',
			do: '<span class="jamo">ㄼ</span> keeps its ㄹ, but <span class="jamo">ㄺ</span> drops it. Both start with ㄹ. So what decides it?',
			stage: [
				{ glyph: 'ㄼ', caption: 'says ㄹ' },
				{ glyph: 'ㄺ', caption: 'says ㄱ' }
			],
			vs: 'vs',
			options: [
				'A short list you memorize',
				'Whether the vowel is bright',
				'Whether the word is a verb',
				'Always the louder one wins'
			],
			stack: true,
			answer: 0,
			miss: '<p>Look for a pattern that separates them — there genuinely is not one.</p>',
			teach:
				'<p>There is no derivable rule. <span class="jamo">ㄺ ㄻ ㄿ</span> take the second letter; the other eight take the first. That is a list.</p><p>This is the one place in Hangul where the system stops being generative and you simply learn eleven facts. It is also why these eleven are in Review — spaced repetition exists precisely for material like this.</p>'
		},

		/* ---- Clusters with ㅎ make the next consonant aspirated ---- */
		{
			type: 'cluster',
			do: 'Which letter survives here?',
			word: '많다',
			cluster: 'ㄶ',
			pron: '[만타]',
			gloss: 'to be many',
			teach:
				'<p><span class="jamo">ㄴ</span> survives — but look at the pronunciation. Not <span class="hg">[만다]</span>. <span class="hg">[만타]</span>.</p><p>The <span class="jamo">ㅎ</span> does not vanish. It jumps forward and <em>aspirates</em> the next consonant: <span class="jamo">ㄷ</span> → <span class="jamo">ㅌ</span>. It loses its slot but not its breath.</p>'
		},
		{
			type: 'cluster',
			do: 'Predict both parts: which letter survives, and what happens to the ㄷ after it.',
			word: '싫다',
			cluster: 'ㅀ',
			pron: '[실타]',
			gloss: 'to dislike',
			teach:
				'<p><span class="jamo">ㄹ</span> survives, and the <span class="jamo">ㅎ</span> aspirates the <span class="jamo">ㄷ</span> into <span class="jamo">ㅌ</span> again.</p><p>Both ㅎ-clusters behave identically: drop the ㅎ from the slot, spend it on the next consonant.</p>'
		},

		/* ---- Two verb stems break the cluster rules ---- */
		{
			type: 'choice',
			do: '<span class="hg">밟다</span> means <em>to step on</em>. Rule A says <span class="jamo">ㄼ</span> keeps its ㄹ, so this should be [발따]. What is it actually?',
			stage: [{ glyph: '밟다' }],
			options: ['[밥따]', '[발따]', '[발타]', '[밥타]'],
			answer: 0,
			teach:
				'<p><span class="hg">[밥따]</span>. The stem <span class="hg">밟-</span> breaks Rule A before a consonant and takes <span class="jamo">ㅂ</span> instead.</p><p>It is written into the Standard Pronunciation Rules as a named exception. A handful of <span class="hg">넓-</span> compounds do the same thing.</p>'
		},
		{
			type: 'choice',
			do: '<span class="hg">읽고</span> is <em>read-and</em>. Rule B says <span class="jamo">ㄺ</span> gives ㄱ, so [익꼬]. But before a ㄱ, a verb stem flips. What is it?',
			stage: [{ glyph: '읽고' }],
			options: ['[일꼬]', '[익꼬]', '[일고]', '[익고]'],
			answer: 0,
			miss: '<p>The flip means the <em>other</em> letter survives than Rule B predicts.</p>',
			teach:
				'<p><span class="hg">[일꼬]</span>. When <span class="jamo">ㄺ</span> is the end of a <strong>verb stem</strong> and the next sound is <span class="jamo">ㄱ</span>, Rule B inverts and <span class="jamo">ㄹ</span> survives.</p><p>Compare <span class="hg">맑게</span> → <span class="hg">[말께]</span>. Watch what this does to the very next card.</p>'
		},

		/* ---- Read from the letters alone ---- */
		{
			type: 'read',
			do: 'Same ㄺ cluster as 읽고 — but this is a noun, not a verb stem.',
			blocks: [
				{ block: '닭', reading: 'dak' },
				{ block: '고', reading: 'go' },
				{ block: '기', reading: 'gi' }
			],
			options: ['chicken', 'seafood', 'sausage', 'lettuce'],
			answer: 0,
			teach:
				'<p><strong>dak-go-gi</strong> — chicken. Said <span class="hg">[닥꼬기]</span>.</p><p>Here <span class="jamo">ㄺ</span> follows plain Rule B and gives <span class="jamo">ㄱ</span> — because <span class="hg">닭</span> is a noun. The <span class="hg">읽고</span> → <span class="hg">[일꼬]</span> flip was specifically a <em>verb stem</em> thing. Same cluster, different word class, different answer.</p>'
		},
		{
			type: 'read',
			do: 'Rule A cluster. Read it, then flatten it.',
			blocks: [
				{ block: '여', reading: 'yeo' },
				{ block: '덟', reading: 'deol' }
			],
			options: ['eight', 'seven', 'three', 'forty'],
			answer: 0,
			teach:
				'<p><strong>yeo-deol</strong> — eight. <span class="jamo">ㄼ</span> keeps its <span class="jamo">ㄹ</span>, exactly as Rule A promises — and unlike <span class="hg">밟다</span>.</p>'
		},
		{
			type: 'read',
			do: 'One more Rule A cluster, and then you are done with the writing system.',
			blocks: [
				{ block: '앉', reading: 'an' },
				{ block: '다', reading: 'da' }
			],
			options: ['to sit', 'to eat', 'to run', 'to see'],
			answer: 0,
			teach:
				'<p><strong>an-da</strong>, said <span class="hg">[안따]</span> — to sit. <span class="jamo">ㄵ</span> keeps its <span class="jamo">ㄴ</span>.</p><p>That is the whole writing system. Every letter, every compound, every slot, every cluster. Nothing further gets added to the page — from here on, what you learn is how the page <em>sounds</em>.</p>'
		}
	]
};
