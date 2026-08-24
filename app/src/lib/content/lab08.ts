import type { Lab } from './types';

export const lab08: Lab = {
	id: '0008',
	number: 8,
	title: 'The Letter That Is Only Breath',
	standfirst:
		'ㅎ is a puff of air, and puffs do not survive contact. Next to a consonant it aspirates it; before a vowel it simply vanishes.',
	minutes: 10,
	unlocks: 'lab08',
	requires: '0007',
	finish: {
		title: 'Spent, or silent',
		summary:
			'ㅎ touching ㄱ/ㄷ/ㅈ — from either side — fuses into ㅋ/ㅌ/ㅊ. ㅎ before a vowel is not said at all, and ㄶ/ㅀ liaise their survivor. Next: what ㄹ does to its neighbors — the last drilled sound change.'
	},
	phases: [
		{ title: 'ㅎ plus a stop becomes aspirated', count: 4 },
		{ title: 'A stop plus ㅎ becomes aspirated', count: 4 },
		{ title: 'ㅎ before a vowel is not pronounced', count: 4 },
		{ title: 'The next letter decides what ㅎ does', count: 2 },
		{ title: 'Read from the letters alone', count: 2 },
	],
	steps: [

		/* ---- ㅎ plus a stop becomes aspirated ---- */
		{
			type: 'choice',
			do: 'You can read this. Spoken Korean says something shorter. What happened?',
			stage: [
				{ glyph: '좋다', caption: 'as written' },
				{ glyph: '조타', caption: 'as said' }
			],
			vs: '→',
			options: [
				'The ㅎ and ㄷ fused into an aspirated ㅌ',
				'The ㅎ jumped over into the following block',
				'The ㅎ tensed the following ㄷ to ㄸ',
				'The ㄷ was dropped and only ㅎ stayed'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="hg">좋</span> ends in <span class="jamo">ㅎ</span> — a bare puff of air. <span class="hg">다</span> starts with plain <span class="jamo">ㄷ</span>. Puff + plain stop = aspirated stop: <span class="jamo">ㅌ</span>. <span class="hg">[조타]</span>.</p>'
		},
		{
			type: 'choice',
			do: 'Lab 01 built <span class="jamo">ㅌ</span> from <span class="jamo">ㄷ</span> by adding a stroke. What did that stroke mean?',
			options: [
				'A puff of breath added to the stop',
				'A doubling that made the stop tense',
				'A change in where the tongue touches',
				'A silent letter written for spelling only'
			],
			stack: true,
			answer: 0,
			miss: '<p>Hold your palm to your mouth and say <em>d</em>, then <em>t</em>. One of them pushes air.</p>',
			teach:
				'<p>The stroke <em>is</em> aspiration — and <span class="jamo">ㅎ</span> is aspiration with no consonant attached. So <span class="jamo">ㅎ</span> next to <span class="jamo">ㄱ</span>/<span class="jamo">ㄷ</span>/<span class="jamo">ㅈ</span> just hands over its puff: <span class="jamo">ㅋ</span>/<span class="jamo">ㅌ</span>/<span class="jamo">ㅊ</span>. Article 12.</p>'
		},
		{
			type: 'hmerge',
			do: 'An ㅎ batchim, then plain <span class="jamo">ㄱ</span>. Operate the junction.',
			word: '좋고',
			gloss: 'good, and…',
			teach:
				'<p><span class="hg">[조코]</span>. The puff fuses forward: <span class="jamo">ㄱ</span> → <span class="jamo">ㅋ</span>.</p>'
		},
		{
			type: 'hmerge',
			do: 'Lab 05 said ㅎ-clusters spend their ㅎ. Operate the junction.',
			word: '많다',
			gloss: 'to be many',
			teach:
				'<p><span class="hg">[만타]</span>. <span class="jamo">ㄶ</span> keeps its <span class="jamo">ㄴ</span> in the slot and spends the <span class="jamo">ㅎ</span> on <span class="jamo">ㄷ</span> → <span class="jamo">ㅌ</span>. Lab 05 promised this lab.</p>'
		},

		/* ---- A stop plus ㅎ becomes aspirated ---- */
		{
			type: 'choice',
			do: 'This time the ㅎ is on the <em>right</em>. Who aspirates?',
			stage: [
				{ glyph: '축하', caption: 'as written' },
				{ glyph: '추카', caption: 'as said' }
			],
			vs: '→',
			options: [
				'The stop before ㅎ fuses forward into ㅋ',
				'The ㅎ deletes and nothing else changes here',
				'The ㅎ tenses the stop into ㄲ',
				'The stop jumps into ㅎ like liaison does'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>The rule reads in both directions: stop + <span class="jamo">ㅎ</span> fuses just like <span class="jamo">ㅎ</span> + stop. <span class="hg">축</span>\'s <span class="jamo">ㄱ</span> and <span class="hg">하</span>\'s <span class="jamo">ㅎ</span> become one <span class="jamo">ㅋ</span>: <span class="hg">[추카]</span>.</p>'
		},
		{
			type: 'hmerge',
			do: 'A stop batchim, then an ㅎ lead. Operate the junction.',
			word: '입학',
			gloss: 'school admission',
			teach:
				'<p><span class="hg">[이팍]</span>. <span class="jamo">ㅂ</span> + <span class="jamo">ㅎ</span> → <span class="jamo">ㅍ</span>.</p>'
		},
		{
			type: 'hmerge',
			do: 'Lab 04 flattened this batchim already. Operate the junction.',
			word: '못하다',
			gloss: 'to be unable to',
			teach:
				'<p><span class="hg">[모타다]</span>. <span class="jamo">ㅅ</span> neutralizes to <span class="jamo">[ㄷ]</span> first — Lab 04 — and <em>that</em> fuses with <span class="jamo">ㅎ</span> into <span class="jamo">ㅌ</span>. Two rules, one junction.</p>'
		},
		{
			type: 'choice',
			do: 'In one sentence, aspiration is…',
			options: [
				'ㅎ and a plain stop fusing into one aspirate',
				'ㅎ and a tense stop trading their places',
				'a stop doubling itself whenever ㅎ comes after',
				'ㅎ turning every next stop into a nasal'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><strong>격음화</strong>. Either order, same fusion: the puff and the stop become the stop\'s aspirated twin. Article 12.</p>'
		},

		/* ---- ㅎ before a vowel is not pronounced ---- */
		{
			type: 'choice',
			do: 'Now the neighbor is a vowel. What happened to the ㅎ?',
			stage: [
				{ glyph: '좋아요', caption: 'as written' },
				{ glyph: '조아요', caption: 'as said' }
			],
			vs: '→',
			options: [
				'It is simply not pronounced at all',
				'It jumped into the ㅇ like liaison',
				'It aspirated the following vowel sound',
				'It became a ㄷ, like in isolation'
			],
			stack: true,
			answer: 0,
			miss: '<p>Lab 06 refused to liaise this word. There was a reason.</p>',
			teach:
				'<p>A puff with nothing to push against just disappears. <span class="hg">[조아요]</span>. This is why Lab 06 kept <span class="hg">좋아요</span> out of the liaison lab — <span class="jamo">ㅎ</span> does not jump, it dies.</p>'
		},
		{
			type: 'hmerge',
			do: 'An ㅎ batchim, then a vowel. Operate the junction.',
			word: '좋아요',
			gloss: 'it is good',
			teach: '<p><span class="hg">[조아요]</span>. Silent exit.</p>'
		},
		{
			type: 'hmerge',
			do: 'A cluster this time. Operate the junction.',
			word: '많아',
			gloss: 'there are many',
			teach:
				'<p><span class="hg">[마나]</span>. The <span class="jamo">ㅎ</span> dies, and the surviving <span class="jamo">ㄴ</span> makes the jump liaison wanted all along.</p>'
		},
		{
			type: 'hmerge',
			do: 'Same cluster family, ㄹ survivor. Operate the junction.',
			word: '싫어',
			gloss: 'I don’t want to',
			teach:
				'<p><span class="hg">[시러]</span>. <span class="jamo">ㅀ</span> drops its <span class="jamo">ㅎ</span>; <span class="jamo">ㄹ</span> jumps. A word you will hear daily.</p>'
		},

		/* ---- The next letter decides what ㅎ does ---- */
		{
			type: 'hmerge',
			do: 'Careful — read the junction before you touch it.',
			word: '학교',
			gloss: 'school',
			teach:
				'<p>No <span class="jamo">ㅎ</span> anywhere near the junction — this is Lab 07\'s tensification word: <span class="hg">[학꾜]</span>. This lab\'s rules only fire when <span class="jamo">ㅎ</span> is touching.</p>'
		},
		{
			type: 'choice',
			do: 'Same ㅎ batchim in both. Why do they part ways?',
			stage: [{ glyph: '좋고' }, { glyph: '좋아요' }],
			vs: 'vs',
			options: [
				'A consonant takes the puff; a vowel gets nothing',
				'A vowel takes the puff; a consonant gets nothing',
				'The longer word always deletes its written ㅎ',
				'The shorter word always deletes its written ㅎ'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>The neighbor decides, exactly like Lab 07. Consonant → fuse. Vowel → vanish. <span class="jamo">ㅎ</span> never survives a junction as written.</p>'
		},

		/* ---- Read from the letters alone ---- */
		{
			type: 'read',
			do: 'Read it as a word.',
			blocks: [
				{ block: '축', reading: 'chuk' },
				{ block: '하', reading: 'ha' }
			],
			options: ['congratulations', 'considerations', 'communications', 'confrontations'],
			answer: 0,
			teach:
				'<p><strong>chuk-ha</strong>, said <span class="hg">[추카]</span>. The word on every birthday message you will ever receive.</p>'
		},
		{
			type: 'read',
			do: 'Read it as a phrase.',
			blocks: [
				{ block: '좋', reading: 'jot' },
				{ block: '아', reading: 'a' },
				{ block: '요', reading: 'yo' }
			],
			options: ['it is good', 'it is over', 'it is cold', 'it is late'],
			answer: 0,
			teach:
				'<p><strong>jo-a-yo</strong> — the everyday yes-I-like-it. The deck keeps all of these now. One drilled rule remains: <span class="jamo">ㄹ</span>.</p>'
		}
	]
};
