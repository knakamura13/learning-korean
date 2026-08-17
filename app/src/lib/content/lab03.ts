import type { Lab } from './types';

export const lab03: Lab = {
	id: '0003',
	number: 3,
	title: 'Eleven Compounds, Seven Sounds',
	standfirst:
		'The last eleven vowels are just the ten you know, fused in pairs. Some pairs are impossible — and finding out why is the point of this lab.',
	minutes: 9,
	unlocks: 'lab03',
	requires: '0002',
	finish: {
		title: 'That is the entire vowel system',
		summary:
			'Twenty-one written vowels, and you built every compound from parts you already had. You also found the rule that says which pairs are even possible, and learned that four of the eleven have quietly collapsed into two sounds. Next lab: batchim — what happens when a consonant moves to the bottom of the block.'
	},
	steps: [
		{
			type: 'choice',
			act: 'Act 1 · the first rule',
			do: 'A vowel you know, and a new one. What was added?',
			stage: [
				{ glyph: 'ㅏ', caption: 'a' },
				{ glyph: 'ㅐ', caption: '?' }
			],
			vs: '→',
			options: [
				'A vertical stroke on the right',
				'A second tick on the right',
				'A horizontal stroke on top',
				'A vertical stroke on the left'
			],
			stack: true,
			answer: 0,
			miss:
				'<p>Careful — a second <em>tick</em> would give you <span class="jamo">ㅑ</span>. This is a full-height stroke.</p>',
			teach:
				'<p>A whole <span class="jamo">ㅣ</span> was welded onto the end.</p><p>That is rule one of two: <strong>add ㅣ to close the vowel</strong>. Now do it yourself.</p>'
		},
		{
			type: 'fusion',
			act: 'Act 1 · fuse it',
			do: 'Fuse the two pieces that make <em>ae</em>.',
			hint: 'The vowel you just saw. Pick its two parts.',
			target: 'ㅐ',
			targetName: 'ae',
			first: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ'],
			second: ['ㅣ', 'ㅏ', 'ㅓ'],
			teach:
				'<p><span class="jamo">ㅏ</span> + <span class="jamo">ㅣ</span> = <span class="jamo">ㅐ</span>. Roughly the vowel in <em>bed</em>.</p>'
		},
		{
			type: 'fusion',
			act: 'Act 1 · fuse it',
			do: 'Same rule on the dark twin. Fuse <em>e</em>.',
			target: 'ㅔ',
			targetName: 'e',
			first: ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ'],
			second: ['ㅣ', 'ㅏ', 'ㅓ'],
			teach:
				'<p><span class="jamo">ㅓ</span> + <span class="jamo">ㅣ</span> = <span class="jamo">ㅔ</span>.</p><p>You have now built two different vowels. Here is the thing nobody warns you about.</p>'
		},
		{
			type: 'choice',
			act: 'Act 1 · the good news',
			do: 'You just built <span class="jamo">ㅐ</span> and <span class="jamo">ㅔ</span> from different parts. In modern Seoul speech they are…',
			stage: [{ glyph: 'ㅐ' }, { glyph: 'ㅔ' }],
			vs: 'vs',
			options: [
				'Identical in modern Seoul speech',
				'Different only in formal speech',
				'Different by vowel length only',
				'Identical only in very fast speech'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>The same sound. 개 (dog) and 게 (crab) are homophones for essentially every speaker under fifty.</p><p>This is <em>good news</em>: it is one fewer sound to hear. The contrast survives only in spelling, like English <em>their / there / they’re</em> — and Koreans misspell these too. Learn to read both; do not strain to hear a difference that is no longer there.</p>'
		},
		{
			type: 'fusion',
			act: 'Act 1 · the glide survives',
			do: 'The y-glide from Lab 02 still works. Fuse <em>ye</em>.',
			hint: 'Start from the glide version of ㅓ.',
			target: 'ㅖ',
			targetName: 'ye',
			first: ['ㅑ', 'ㅕ', 'ㅗ', 'ㅜ'],
			second: ['ㅣ', 'ㅏ', 'ㅐ'],
			teach:
				'<p><span class="jamo">ㅕ</span> + <span class="jamo">ㅣ</span> = <span class="jamo">ㅖ</span>. The glide rides along untouched.</p><p>Same move gives <span class="jamo">ㅑ</span> + <span class="jamo">ㅣ</span> = <span class="jamo">ㅒ</span>.</p>'
		},
		{
			type: 'fusion',
			act: 'Act 2 · the second rule',
			do: 'New move: put a <strong>round</strong> vowel first. Fuse <em>wa</em>.',
			hint: 'ㅗ leading, and something bright after it.',
			target: 'ㅘ',
			targetName: 'wa',
			first: ['ㅗ', 'ㅜ', 'ㅏ', 'ㅡ'],
			second: ['ㅏ', 'ㅓ', 'ㅣ'],
			teach:
				'<p><span class="jamo">ㅗ</span> + <span class="jamo">ㅏ</span> = <span class="jamo">ㅘ</span>, said <span class="rom">wa</span>.</p><p>Rule two: <strong>a rounded vowel in front becomes a w.</strong> Because your lips start rounded and then open — which is physically what a <em>w</em> is.</p>'
		},
		{
			type: 'fusion',
			act: 'Act 2 · the dark twin',
			do: 'Now the dark version. Fuse <em>wo</em>.',
			target: 'ㅝ',
			targetName: 'wo',
			first: ['ㅗ', 'ㅜ', 'ㅏ', 'ㅡ'],
			second: ['ㅏ', 'ㅓ', 'ㅣ'],
			teach:
				'<p><span class="jamo">ㅜ</span> + <span class="jamo">ㅓ</span> = <span class="jamo">ㅝ</span>.</p><p>Look at what you have built: <span class="jamo">ㅗ</span>+<span class="jamo">ㅏ</span> and <span class="jamo">ㅜ</span>+<span class="jamo">ㅓ</span>. Never <span class="jamo">ㅗ</span>+<span class="jamo">ㅓ</span>. Why not?</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · why not',
			do: 'Try it in your head: <span class="jamo">ㅗ</span>+<span class="jamo">ㅓ</span> is not a Korean vowel. What rules it out?',
			stage: [
				{ glyph: 'ㅗ', caption: 'bright' },
				{ glyph: 'ㅓ', caption: 'dark' }
			],
			vs: '+',
			options: [
				'Bright vowels only pair with bright',
				'Front vowels only pair with front',
				'Short vowels only pair with short',
				'Round vowels only pair with round'
			],
			stack: true,
			answer: 0,
			miss: '<p>Think back to Lab 02 — the tick above or right vs below or left.</p>',
			teach:
				'<p><strong>Vowel harmony.</strong> The bright/dark split you met in Lab 02 is not decoration — it governs which vowels may combine at all.</p><p>Bright <span class="jamo">ㅗ</span> takes bright <span class="jamo">ㅏ</span>. Dark <span class="jamo">ㅜ</span> takes dark <span class="jamo">ㅓ</span>. Half the imaginable pairs simply do not exist, which is half as much to learn.</p>'
		},
		{
			type: 'fusion',
			act: 'Act 2 · w plus i',
			do: 'Both rules at once. Fuse <em>wi</em>.',
			target: 'ㅟ',
			targetName: 'wi',
			first: ['ㅗ', 'ㅜ', 'ㅡ'],
			second: ['ㅣ', 'ㅏ', 'ㅓ'],
			teach:
				'<p><span class="jamo">ㅜ</span> + <span class="jamo">ㅣ</span> = <span class="jamo">ㅟ</span>. Round vowel in front → w; <span class="jamo">ㅣ</span> on the end → closed.</p><p><span class="jamo">ㅗ</span> + <span class="jamo">ㅣ</span> gives you <span class="jamo">ㅚ</span> the same way.</p>'
		},
		{
			type: 'fusion',
			act: 'Act 3 · two layers deep',
			do: 'This one takes a compound as its <em>second</em> piece. Fuse <em>wae</em>.',
			hint: 'A round vowel in front, and one of the vowels you built in Act 1 behind it.',
			target: 'ㅙ',
			targetName: 'wae',
			first: ['ㅗ', 'ㅜ', 'ㅏ'],
			second: ['ㅐ', 'ㅔ', 'ㅣ'],
			teach:
				'<p><span class="jamo">ㅗ</span> + <span class="jamo">ㅐ</span> = <span class="jamo">ㅙ</span> — a compound built on a compound.</p><p>Bright with bright again: <span class="jamo">ㅗ</span> takes <span class="jamo">ㅐ</span>, while dark <span class="jamo">ㅜ</span> takes <span class="jamo">ㅔ</span> to give <span class="jamo">ㅞ</span>.</p>'
		},
		{
			type: 'choice',
			act: 'Act 3 · the payoff',
			do: 'Three different spellings: <span class="jamo">ㅙ ㅚ ㅞ</span>. How many different <em>sounds</em>?',
			stage: [{ glyph: 'ㅙ' }, { glyph: 'ㅚ' }, { glyph: 'ㅞ' }],
			options: ['1', '2', '3', '4'],
			answer: 0,
			miss: '<p>Fewer than you would guess from the spelling.</p>',
			teach:
				'<p>One. All three are said <span class="rom">we</span> in modern speech.</p><p>So the eleven compounds you just built are really about seven sounds. Twenty-one written vowels, roughly seventeen spoken ones. Your ear has less work than your eye — which is the opposite of what beginners fear.</p>'
		},
		{
			type: 'assemble',
			act: 'Act 4 · a new block shape',
			do: 'Compounds change how the block is laid out. Build <em>gwa</em>.',
			hint: 'ㅘ is neither tall nor wide — watch where the consonant lands.',
			target: '과',
			targetName: 'gwa',
			consonants: ['ㄱ', 'ㄴ', 'ㅅ'],
			vowels: ['ㅘ', 'ㅏ', 'ㅗ'],
			teach:
				'<p><span class="hg">과</span>. <span class="jamo">ㅘ</span> is a <strong>wrapping</strong> vowel: it has a wide part and a tall part, so the consonant tucks into the top-left corner.</p><p>That is the third and last block layout. Tall → beside. Wide → above. Wrapping → top-left.</p>'
		},
		{
			type: 'assemble',
			act: 'Act 4 · a new block shape',
			do: 'One more wrapper, opening with the silent placeholder. Build <em>wi</em>.',
			target: '위',
			targetName: 'wi',
			consonants: ['ㅇ', 'ㄱ', 'ㅁ'],
			vowels: ['ㅟ', 'ㅜ', 'ㅣ'],
			teach:
				'<p><span class="hg">위</span> — it means <em>above / on top of</em>, and it is a word you will meet constantly.</p>'
		},
		{
			type: 'read',
			act: 'Act 5 · read it cold',
			do: 'Two blocks. The first one is that odd fusion of the two bare strokes.',
			blocks: [
				{ block: '의', reading: 'ui' },
				{ block: '사', reading: 'sa' }
			],
			options: ['doctor', 'driver', 'dinner', 'dancer'],
			answer: 0,
			teach:
				'<p><strong>ui-sa</strong> — doctor.</p><p><span class="jamo">ㅢ</span> is the shape-shifter: a true glide at the start of a word (here), flat <span class="rom">i</span> mid-word, and <span class="rom">e</span> when it is the possessive particle. All three are standard, not sloppy.</p>'
		},
		{
			type: 'read',
			act: 'Act 5 · read it cold',
			do: 'Your new wrapping vowel, in the wild.',
			blocks: [
				{ block: '과', reading: 'gwa' },
				{ block: '자', reading: 'ja' }
			],
			options: ['snacks', 'grapes', 'grains', 'greens'],
			answer: 0,
			teach:
				'<p><strong>gwa-ja</strong> — snacks, biscuits, sweets. From 菓子.</p><p>You built <span class="jamo">ㅘ</span> from parts about four minutes ago and just read it cold.</p>'
		},
		{
			type: 'read',
			act: 'Act 5 · last one',
			do: 'One of the three merged spellings. Read it anyway.',
			blocks: [
				{ block: '회', reading: 'hoe' },
				{ block: '사', reading: 'sa' }
			],
			options: ['company', 'country', 'concert', 'compass'],
			answer: 0,
			teach:
				'<p><strong>hoe-sa</strong> — company. Said closer to <em>hwe-sa</em>, since <span class="jamo">ㅚ</span> merged into <span class="rom">we</span>.</p><p>Which is exactly why you read the letters and not the romanization. <span class="rom">oe</span> is a historical spelling; the Hangul is what tells you the truth.</p>'
		}
	]
};
