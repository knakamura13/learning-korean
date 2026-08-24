import type { Lab } from './types';

export const lab02: Lab = {
	id: '0002',
	number: 2,
	title: 'Ten Vowels From Two Strokes',
	standfirst:
		'Consonants were pictures of your mouth. Vowels are something else entirely — a coordinate system. Two strokes, a tick, and a rule about how many.',
	minutes: 9,
	unlocks: 'lab02',
	requires: '0001',
	finish: {
		title: 'Ten vowels, and you built eight of them',
		summary:
			'Two strokes, a tick, and a count. You never learned a vowel chart — you operated the rule that generates one, then read three real Korean words with it. Next lab: the eleven compound vowels, which are just these ten fused in pairs — and four of them have quietly merged.'
	},
	phases: [
		{ title: 'Vowels are a long stroke and a tick', count: 2 },
		{ title: 'Build the four one-tick vowels', count: 4 },
		{ title: 'A second tick adds a y-glide', count: 3 },
		{ title: 'The vowel with no tick, and the rounded o', count: 2 },
		{ title: 'Build a tall block and a wide block', count: 2 },
		{ title: 'Read from the letters alone', count: 3 },
	],
	steps: [

		/* ---- Vowels are a long stroke and a tick ---- */
		{
			type: 'choice',
			do: 'Four Korean vowels. Ignore what they sound like — what do all four share?',
			stage: [{ glyph: 'ㅏ' }, { glyph: 'ㅓ' }, { glyph: 'ㅗ' }, { glyph: 'ㅜ' }],
			options: [
				'One long stroke plus a tick',
				'Two long strokes crossing each other',
				'One curve joined to one line',
				'Three ticks around a center dot'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>Every one is a <strong>long stroke</strong> and a <strong>short tick</strong>. The only thing that differs is which long stroke, and where the tick sits.</p><p>That is not decoration — it is a coordinate system, and you are about to operate it.</p>'
		},
		{
			type: 'choice',
			do: 'There are only two long strokes. In the 1443 design one means <em>earth</em> and one means <em>a standing person</em>. Which one is earth?',
			stage: [{ glyph: 'ㅣ' }, { glyph: 'ㅡ' }],
			options: ['ㅡ', 'ㅣ'],
			answer: 0,
			miss: '<p>Think about what the ground looks like from the side.</p>',
			teach:
				'<p><span class="jamo">ㅡ</span> is flat, like the horizon — earth. <span class="jamo">ㅣ</span> stands upright — a person.</p><p>The tick was originally a dot meaning <em>heaven</em>. Earth, person, heaven: the whole vowel system is those three marks combined.</p>'
		},

		/* ---- Build the four one-tick vowels ---- */
		{
			type: 'vowel',
			do: 'Build <em>a</em> — the vowel in <em>father</em>.',
			hint: 'Standing person, one tick, on the right.',
			target: 'ㅏ',
			targetName: 'a',
			teach:
				'<p><span class="jamo">ㅣ</span> with one tick on the right is <span class="jamo">ㅏ</span>.</p><p>Now move the tick and watch what happens.</p>'
		},
		{
			type: 'vowel',
			do: 'Same stroke, same single tick — put it on the other side.',
			target: 'ㅓ',
			targetName: 'eo',
			teach:
				'<p><span class="jamo">ㅓ</span>, romanized <span class="rom">eo</span>. It is <em>not</em> an "o" sound — closer to the vowel in <em>duh</em>, unrounded and further back.</p><p>Tick right vs tick left also encodes a real split: right and up are "bright" vowels, left and down are "dark". Korean still pairs particles and sound-words by that split.</p>'
		},
		{
			type: 'vowel',
			do: 'Switch to the earth stroke. One tick, sitting on top.',
			target: 'ㅗ',
			targetName: 'o',
			teach:
				'<p><span class="jamo">ㅗ</span> — a true rounded <em>o</em>. Push your lips into a tight circle.</p>'
		},
		{
			type: 'vowel',
			do: 'Now drop the tick below the line.',
			target: 'ㅜ',
			targetName: 'u',
			teach:
				'<p><span class="jamo">ㅜ</span> — <em>oo</em>, as in <em>moon</em>.</p><p>Four vowels, one stroke each, one tick each. Two more rules and you have all ten.</p>'
		},

		/* ---- A second tick adds a y-glide ---- */
		{
			type: 'choice',
			do: 'A new vowel appears next to one you just built. What changed?',
			stage: [
				{ glyph: 'ㅏ', caption: 'a' },
				{ glyph: 'ㅑ', caption: '?' }
			],
			vs: '→',
			options: [
				'A second tick was added',
				'The stroke was doubled',
				'The tick moved over',
				'The stroke got longer'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>Two ticks instead of one. And <span class="jamo">ㅑ</span> says <span class="rom">ya</span> where <span class="jamo">ㅏ</span> said <span class="rom">a</span>.</p><p>So what does the second tick buy you?</p>'
		},
		{
			type: 'choice',
			do: '<span class="jamo">ㅏ</span> is <em>a</em>. <span class="jamo">ㅑ</span> is <em>ya</em>. The second tick adds…',
			stage: [{ glyph: 'ㅏ' }, { glyph: 'ㅑ' }],
			vs: '+',
			options: [
				'A y sound in front',
				'A longer held vowel',
				'A rise in the pitch',
				'A puff of air after'
			],
			answer: 0,
			teach:
				'<p><strong>Second tick, y-glide.</strong> One rule, and it works on all four:</p><p><span class="jamo">ㅏ→ㅑ</span> &nbsp; <span class="jamo">ㅓ→ㅕ</span> &nbsp; <span class="jamo">ㅗ→ㅛ</span> &nbsp; <span class="jamo">ㅜ→ㅠ</span></p><p>Four vowels learned, four more free.</p>'
		},
		{
			type: 'vowel',
			do: 'Use the rule you just found. Build <em>yo</em>.',
			hint: 'Which stroke gives you o? Now give it the glide.',
			target: 'ㅛ',
			targetName: 'yo',
			teach:
				'<p><span class="jamo">ㅛ</span> — earth stroke, two ticks, on top.</p><p>You derived that one instead of memorizing it. The same move gives you <span class="jamo">ㅑ</span>, <span class="jamo">ㅕ</span> and <span class="jamo">ㅠ</span> whenever you need them.</p>'
		},

		/* ---- The vowel with no tick, and the rounded o ---- */
		{
			type: 'vowel',
			do: 'The two long strokes are vowels by themselves. Build the bare earth stroke.',
			hint: 'Just the earth stroke — no ticks.',
			target: 'ㅡ',
			targetName: 'eu',
			teach:
				'<p><span class="jamo">ㅡ</span> is the one with no English equivalent. Spread your lips as if smiling, then make a vowel from the back of your mouth with <em>no rounding at all</em>.</p><p>Romanized <span class="rom">eu</span>, which misleads badly — it is not <em>you</em> and not <em>oo</em>. Distrust the romanization, trust the letter.</p>'
		},
		{
			type: 'choice',
			do: 'These two are the pair English speakers confuse for years. Which one is made with <strong>rounded</strong> lips?',
			stage: [
				{ glyph: 'ㅓ', caption: 'eo' },
				{ glyph: 'ㅗ', caption: 'o' }
			],
			vs: 'or',
			options: ['ㅗ', 'ㅓ'],
			answer: 0,
			miss: '<p>Say both into your hand. Only one pushes your lips forward into a circle.</p>',
			teach:
				'<p><span class="jamo">ㅗ</span> is rounded. <span class="jamo">ㅓ</span> is not — despite both being romanized with an "o" in them.</p><p>This single confusion causes more misheard Korean than any other vowel problem. Worth over-practicing.</p>'
		},

		/* ---- Build a tall block and a wide block ---- */
		{
			type: 'assemble',
			do: 'Back into syllables. Build <em>na</em>.',
			hint: 'Remember: the vowel’s shape decides where the consonant goes.',
			target: '나',
			targetName: 'na',
			consonants: ['ㄴ', 'ㅁ', 'ㅅ'],
			vowels: ['ㅏ', 'ㅜ', 'ㅡ'],
			teach:
				'<p><span class="hg">나</span> — and it means <em>I / me</em>, so that is your first real Korean word rather than a loanword.</p><p><span class="jamo">ㅏ</span> is tall, so the consonant sits beside it.</p>'
		},
		{
			type: 'assemble',
			do: 'Now a wide vowel. Build <em>nu</em>.',
			target: '누',
			targetName: 'nu',
			consonants: ['ㄴ', 'ㅁ', 'ㅅ'],
			vowels: ['ㅏ', 'ㅜ', 'ㅡ'],
			teach:
				'<p><span class="hg">누</span> stacks vertically, because <span class="jamo">ㅜ</span> is wide.</p><p>Tall vowel → consonant beside. Wide vowel → consonant above. The vowel decides, every time.</p>'
		},

		/* ---- Read from the letters alone ---- */
		{
			type: 'read',
			do: 'Real Korean now, not loanwords. Sound out each block, then tap to check.',
			blocks: [
				{ block: '우', reading: 'u' },
				{ block: '유', reading: 'yu' }
			],
			options: ['milk', 'silk', 'bulk', 'talk'],
			answer: 0,
			teach:
				'<p><strong>u-yu</strong> — milk. Both blocks open with the silent <span class="jamo">ㅇ</span> placeholder.</p><p>The second block is the glide rule doing real work: <span class="jamo">ㅜ</span> → <span class="jamo">ㅠ</span>.</p>'
		},
		{
			type: 'read',
			do: 'Three blocks. Every letter is one you have built.',
			blocks: [
				{ block: '어', reading: 'eo' },
				{ block: '머', reading: 'meo' },
				{ block: '니', reading: 'ni' }
			],
			options: ['mother', 'mentor', 'matter', 'mirror'],
			answer: 0,
			teach:
				'<p><strong>eo-meo-ni</strong> — mother.</p><p>That is the half of your mission about the people in your life, arriving in Lab 02. Two ㅓ and one ㅣ, nothing you have not built by hand.</p>'
		},
		{
			type: 'read',
			do: 'One glide, one wide vowel.',
			blocks: [
				{ block: '야', reading: 'ya' },
				{ block: '구', reading: 'gu' }
			],
			options: ['baseball', 'birthday', 'bookcase', 'backpack'],
			answer: 0,
			teach:
				'<p><strong>ya-gu</strong> — baseball. From 野球, the same characters Japanese uses.</p><p>Notice you read a native-Korean word, a Sino-Korean word, and a loanword across these two labs with exactly the same decoding move. That is the whole point of an alphabet.</p>'
		}
	]
};
