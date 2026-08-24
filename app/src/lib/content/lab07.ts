import type { Lab } from './types';

export const lab07: Lab = {
	id: '0007',
	number: 7,
	title: 'The Stop and Its Neighbor',
	standfirst:
		'Liaison filled an empty ㅇ. The other surprises are what a stop does to the letter that follows — tense it, or become a nasal.',
	minutes: 10,
	unlocks: 'lab07',
	requires: '0006',
	finish: {
		title: 'Two stops, or a stop plus a nasal',
		summary:
			'A ㄱ/ㄷ/ㅂ batchim tenses a following plain ㄱ/ㄷ/ㅂ/ㅅ/ㅈ, and becomes ㅇ/ㄴ/ㅁ before ㄴ/ㅁ. Same junction, different neighbor. Next: ㅎ — aspiration and ㅎ-deletion, the letter Lab 06 refused to cram into liaison.'
	},
	phases: [
		{ title: 'A stop makes the next plain consonant tense', count: 8 },
		{ title: 'A stop is pronounced through the nose before ㄴ or ㅁ', count: 5 },
		{ title: 'Read from the letters alone', count: 3 },
	],
	steps: [

		/* ---- A stop makes the next plain consonant tense ---- */
		{
			type: 'choice',
			do: 'You can read this. Spoken Korean tenses a letter. Which one, and how?',
			stage: [
				{ glyph: '학교', caption: 'as written' },
				{ glyph: '학꾜', caption: 'as said' }
			],
			vs: '→',
			options: [
				'The next ㄱ became a tense ㄲ',
				'The first ㄱ jumped into 교',
				'The first ㄱ became a nasal',
				'The two blocks fused into one'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="hg">학</span> ends with an unreleased <span class="jamo">ㄱ</span>. <span class="hg">교</span> starts with a plain <span class="jamo">ㄱ</span>. Two plain stops in a row: the second becomes <span class="jamo">ㄲ</span>. The spelling still writes <span class="hg">학교</span>.</p><p>Next you operate that junction.</p>'
		},
		{
			type: 'choice',
			do: 'Why did <span class="hg">교</span>\'s <span class="jamo">ㄱ</span> tense, instead of jumping or vanishing?',
			stage: [{ glyph: '학' }, { glyph: '교' }],
			vs: '+',
			options: [
				'A stop batchim tenses a following plain stop',
				'A stop batchim nasalizes every next letter',
				'A stop batchim jumps into a following ㅇ',
				'A stop batchim always doubles itself instead'
			],
			stack: true,
			answer: 0,
			miss:
				'<p>Lab 06\'s jump needed an empty <span class="jamo">ㅇ</span>. <span class="hg">교</span> does not start with <span class="jamo">ㅇ</span>.</p>',
			teach:
				'<p>A following <span class="jamo">ㅇ</span> is liaison. A following <span class="jamo">ㄴ</span>/<span class="jamo">ㅁ</span> is a different rule, later this sitting. A following plain <span class="jamo">ㄱ</span>/<span class="jamo">ㄷ</span>/<span class="jamo">ㅂ</span>/<span class="jamo">ㅅ</span>/<span class="jamo">ㅈ</span> tenses.</p><p>Source: Article 23.</p>'
		},
		{
			type: 'contact',
			do: 'Two plain stops. Operate the junction.',
			word: '학교',
			gloss: 'school',
			teach:
				'<p><span class="hg">[학꾜]</span>. The first <span class="jamo">ㄱ</span> stays; the second tenses.</p>'
		},
		{
			type: 'contact',
			do: 'A verb stem plus <span class="hg">다</span>. Operate the junction.',
			word: '먹다',
			gloss: 'to eat',
			teach:
				'<p><span class="hg">[먹따]</span>. <span class="jamo">ㄱ</span> + <span class="jamo">ㄷ</span>. The <span class="jamo">ㄷ</span> becomes <span class="jamo">ㄸ</span>.</p><p>Verb stems do this constantly.</p>'
		},
		{
			type: 'contact',
			do: 'Same rule, different pair. Operate the junction.',
			word: '잡지',
			gloss: 'magazine',
			teach:
				'<p><span class="hg">[잡찌]</span>. <span class="jamo">ㅂ</span> + <span class="jamo">ㅈ</span> → <span class="jamo">ㅉ</span>. Same rule, different pair.</p>'
		},
		{
			type: 'contact',
			do: 'A word on every street. Operate the junction.',
			word: '식당',
			gloss: 'restaurant',
			teach:
				'<p><span class="hg">[식땅]</span>. <span class="jamo">ㄱ</span> + <span class="jamo">ㄷ</span> again, in a word on every street.</p>'
		},
		{
			type: 'choice',
			do: 'In one sentence, tensification is…',
			options: [
				'After a stop, the next plain consonant tenses',
				'After a stop, the next vowel becomes tense',
				'After a nasal, the next stop always tenses',
				'After a stop, the batchim itself becomes ㅇ'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><strong>경음화</strong>. Article 23. <span class="jamo">ㄱ</span>/<span class="jamo">ㄷ</span>/<span class="jamo">ㅂ</span> at the end, then <span class="jamo">ㄱ</span>/<span class="jamo">ㄷ</span>/<span class="jamo">ㅂ</span>/<span class="jamo">ㅅ</span>/<span class="jamo">ㅈ</span> at the start.</p><p>Lab 05\'s <span class="hg">[업따]</span> was this after a cluster threw a letter away. This lab is the simple-batchim case.</p>'
		},
		{
			type: 'contact',
			do: '<span class="hg">한</span> ends in <span class="jamo">ㄴ</span>. Operate the junction.',
			word: '한국',
			gloss: 'Korea',
			teach:
				'<p><span class="hg">[한국]</span>, not <span class="hg">[한꾹]</span>. <span class="hg">한</span> ends in <span class="jamo">ㄴ</span>, not a stop. Tensification does not fire.</p><p>The rule is picky about <em>which</em> letter closes the first block.</p>'
		},

		/* ---- A stop is pronounced through the nose before ㄴ or ㅁ ---- */
		{
			type: 'choice',
			do: 'Same kind of junction, different next letter. What happened to <span class="jamo">ㅂ</span>?',
			stage: [
				{ glyph: '입니다', caption: 'as written' },
				{ glyph: '임니다', caption: 'as said' }
			],
			vs: '→',
			options: [
				'The ㅂ became ㅁ before ㄴ',
				'The ㅂ jumped into the next block',
				'The ㅂ tensed the following ㄴ',
				'The ㅂ vanished leaving an empty ㅇ'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="hg">입</span> ends in a stop. <span class="hg">니</span> starts with <span class="jamo">ㄴ</span>. You cannot hold a <span class="jamo">ㅂ</span> and then open the nose. The <span class="jamo">ㅂ</span> becomes <span class="jamo">ㅁ</span>: <span class="hg">[임니다]</span>.</p>'
		},
		{
			type: 'choice',
			do: '<span class="jamo">ㄱ</span>/<span class="jamo">ㄷ</span>/<span class="jamo">ㅂ</span> before <span class="jamo">ㄴ</span> or <span class="jamo">ㅁ</span> become…',
			options: [
				'Stops become nasals before ㄴ and ㅁ',
				'Stops become tense before ㄴ and ㅁ',
				'Stops jump into ㄴ like into ㅇ',
				'A stop always becomes ㅇ, even before ㄱ'
			],
			stack: true,
			answer: 0,
			miss: '<p><span class="hg">학교</span> already showed what a following <span class="jamo">ㄱ</span> does.</p>',
			teach:
				'<p><span class="jamo">ㄱ</span>→<span class="jamo">ㅇ</span>, <span class="jamo">ㄷ</span>→<span class="jamo">ㄴ</span>, <span class="jamo">ㅂ</span>→<span class="jamo">ㅁ</span>. Same place of articulation, nasal. Article 18. That is <strong>비음화</strong>.</p>'
		},
		{
			type: 'contact',
			do: 'A stop, then <span class="jamo">ㅁ</span>. Operate the junction.',
			word: '국물',
			gloss: 'broth',
			teach:
				'<p><span class="hg">[궁물]</span>. <span class="jamo">ㄱ</span> before <span class="jamo">ㅁ</span> becomes <span class="jamo">ㅇ</span>.</p>'
		},
		{
			type: 'contact',
			do: 'The polite copula. Operate the junction.',
			word: '입니다',
			gloss: 'it is, polite',
			teach:
				'<p><span class="hg">[임니다]</span>. The copula. This is why <span class="hg">입니다</span> does not sound like the spelling.</p>'
		},
		{
			type: 'contact',
			do: '<span class="jamo">ㄱ</span> before <span class="jamo">ㄴ</span>. Operate the junction.',
			word: '학년',
			gloss: 'school year',
			teach:
				'<p><span class="hg">[항년]</span>. <span class="jamo">ㄱ</span> before <span class="jamo">ㄴ</span> becomes <span class="jamo">ㅇ</span>. Names and school words do this constantly.</p>'
		},

		/* ---- Read from the letters alone ---- */
		{
			type: 'choice',
			do: 'Both start with <span class="hg">국</span>-class <span class="jamo">ㄱ</span>. Why do they split?',
			stage: [
				{ glyph: '학교' },
				{ glyph: '국물' }
			],
			vs: 'vs',
			options: [
				'ㄱ then ㄱ tenses; ㄱ then ㅁ nasalizes',
				'ㄱ then ㄱ nasalizes; ㄱ then ㅁ tenses',
				'Both of these words tense the second block',
				'Both of these words nasalize the first batchim'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>The first letter is the same job (a stop). The <em>next</em> letter picks the rule. That is the whole sitting.</p>'
		},
		{
			type: 'read',
			do: 'Read it as a word.',
			blocks: [
				{ block: '학', reading: 'hak' },
				{ block: '교', reading: 'gyo' }
			],
			options: ['a school', 'a student', 'a college', 'a lesson'],
			answer: 0,
			teach:
				'<p><strong>hak-gyo</strong>, said <span class="hg">[학꾜]</span>. You derived the <span class="jamo">ㄲ</span>. The deck will keep it.</p>'
		},
		{
			type: 'read',
			do: 'Read it as a phrase.',
			blocks: [
				{ block: '입', reading: 'ip' },
				{ block: '니', reading: 'ni' },
				{ block: '다', reading: 'da' }
			],
			options: ['it is', 'it was', 'you are', 'we are'],
			answer: 0,
			teach:
				'<p><strong>im-ni-da</strong>, said <span class="hg">[임니다]</span>. The polite copula, as actually said. Next sound-change lab is <span class="jamo">ㅎ</span>.</p>'
		}
	]
};
