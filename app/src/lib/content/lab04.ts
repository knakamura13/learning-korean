import type { Lab } from './types';

export const lab04: Lab = {
	id: '0004',
	number: 4,
	title: 'The Bottom of the Block',
	standfirst:
		'A third slot opens underneath. Sixteen different consonants can fill it — and they make seven sounds between them. This is the lab that lets you read Korean names.',
	minutes: 10,
	unlocks: 'lab04',
	requires: '0003',
	finish: {
		title: 'You can now read a Korean name',
		summary:
			'The bottom slot was the last structural piece of the writing system. You built 김 and 박, read 한국 and 한글, and learned why sixteen different letters make only seven sounds down there. Next lab: the eleven clusters — two consonants sharing one bottom slot, and the rule for which one wins.'
	},
	steps: [
		{
			type: 'assemble',
			act: 'Act 1 · a slot opens',
			do: 'There is a third slot under the block now. Build <em>gang</em>.',
			hint: 'ㄱ on top, ㅏ beside it, and something underneath.',
			target: '강',
			targetName: 'gang · river',
			consonants: ['ㄱ', 'ㄴ', 'ㅅ'],
			vowels: ['ㅏ', 'ㅗ'],
			finals: ['ㅇ', 'ㄴ', 'ㅁ'],
			teach:
				'<p><span class="hg">강</span> — river. That bottom consonant is a <strong>batchim</strong> (받침), literally "support".</p><p>And look what you just did to <span class="jamo">ㅇ</span>. Silent on top, holding the slot open. Down here it finally speaks: <span class="rom">ng</span>, as in <em>sing</em>.</p>'
		},
		{
			type: 'assemble',
			act: 'Act 1 · a slot opens',
			do: 'Same consonant twice — once on top, once underneath. Build <em>bap</em>.',
			target: '밥',
			targetName: 'bap · cooked rice, a meal',
			consonants: ['ㅂ', 'ㄷ', 'ㅁ'],
			vowels: ['ㅏ', 'ㅜ'],
			finals: ['ㅂ', 'ㄱ', 'ㅅ'],
			teach:
				'<p><span class="hg">밥</span> — rice, and by extension <em>a meal</em>. One of the most-used words in the language.</p><p>On top, <span class="jamo">ㅂ</span> is a <em>b</em>. On the bottom it is a <em>p</em> — and a strange one. Next card.</p>'
		},
		{
			type: 'choice',
			act: 'Act 1 · unreleased',
			do: 'Say English <em>cup</em>, then Korean <span class="hg">밥</span>. Your hand in front of your mouth. What does Korean do differently at the end?',
			stage: [{ glyph: '밥' }],
			options: [
				'Stops the air and holds it',
				'Lets more air escape after it',
				'Adds a small vowel after it',
				'Repeats the consonant sound twice'
			],
			stack: true,
			answer: 0,
			miss: '<p>English releases a puff after the <em>p</em>. Korean does the opposite.</p>',
			teach:
				'<p>Korean final stops are <strong>unreleased</strong>: the air is cut off and held, never let go.</p><p>Releasing them is the single most recognizable foreign-accent marker in Korean. Costs nothing to fix now, costs years later.</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · the collapse',
			do: 'Three different words, three different bottom letters. How many different <em>sounds</em> do they end with?',
			stage: [
				{ glyph: '낫', caption: 'sickle' },
				{ glyph: '낮', caption: 'daytime' },
				{ glyph: '낯', caption: 'face' }
			],
			options: ['1', '2', '3', '4'],
			answer: 0,
			miss: '<p>Fewer than the spelling suggests — same trick as ㅙ ㅚ ㅞ in Lab 03.</p>',
			teach:
				'<p>One. All three are said <span class="rom">nat</span>, with an unreleased <em>t</em>.</p><p>This is <strong>neutralization</strong>: down in the bottom slot, <span class="jamo">ㅅ</span>, <span class="jamo">ㅈ</span> and <span class="jamo">ㅊ</span> all collapse into <span class="jamo">ㄷ</span>. It is why Korean has so many homophones — and why you can read a word correctly and still not catch it in speech.</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · call it',
			do: '<span class="hg">옷</span> means <em>clothes</em>. Which of the seven sounds does it actually end with?',
			stage: [{ glyph: '옷' }],
			options: ['ㄷ', 'ㄱ', 'ㅂ', 'ㄴ'],
			answer: 0,
			teach:
				'<p><span class="jamo">ㅅ</span> at the bottom says <span class="jamo">ㄷ</span>. <span class="hg">옷</span> is <span class="rom">ot</span>, not <span class="rom">os</span>.</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · call it',
			do: '<span class="hg">부엌</span> means <em>kitchen</em>. What does that last block really end with?',
			stage: [{ glyph: '부엌' }],
			options: ['ㄱ', 'ㄷ', 'ㅂ', 'ㅇ'],
			answer: 0,
			teach:
				'<p>The aspirated <span class="jamo">ㅋ</span> loses its puff down there and becomes a plain unreleased <span class="jamo">ㄱ</span>.</p><p>Aspiration is a <em>top of the block</em> luxury. The bottom slot does not have room for it.</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · call it',
			do: '<span class="hg">앞</span> means <em>front</em>. Last one — what does it end with?',
			stage: [{ glyph: '앞' }],
			options: ['ㅂ', 'ㄷ', 'ㄱ', 'ㅁ'],
			answer: 0,
			teach:
				'<p><span class="jamo">ㅍ</span> → <span class="jamo">ㅂ</span>. Same story: the aspirated letter flattens into its plain partner.</p><p>You have now seen the three big collapses: anything k-ish → <span class="jamo">ㄱ</span>, anything t-ish or s-ish → <span class="jamo">ㄷ</span>, anything p-ish → <span class="jamo">ㅂ</span>.</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · the number',
			do: 'Sixteen different consonants can sit in that bottom slot. How many sounds do they make between them?',
			options: ['5', '6', '7', '9'],
			answer: 2,
			miss: '<p>Count the survivors: the three stops, the three nasals, and one more.</p>',
			teach:
				'<p><strong>Seven.</strong> <span class="jamo">ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ</span> — and nothing else, ever.</p><p>Three unreleased stops, three nasals, and <span class="jamo">ㄹ</span>. Sixteen letters, seven sounds. Written Korean keeps the spelling to show you what the word <em>is</em>; spoken Korean flattens it.</p>'
		},
		{
			type: 'assemble',
			act: 'Act 2 · build a flattened one',
			do: 'Build <em>bat</em> — a field. Use the letter that <em>looks</em> like a t, not the one that sounds like it.',
			hint: 'The aspirated ㅌ. It will not sound aspirated down there.',
			target: '밭',
			targetName: 'bat · field',
			consonants: ['ㅂ', 'ㅁ', 'ㅅ'],
			vowels: ['ㅏ', 'ㅓ'],
			finals: ['ㅌ', 'ㄷ', 'ㅂ'],
			teach:
				'<p><span class="hg">밭</span> is spelled with <span class="jamo">ㅌ</span> but pronounced <span class="hg">[받]</span>.</p><p>The spelling is not wrong — it is preserving the word’s identity, so that when a vowel follows, the real <span class="jamo">ㅌ</span> comes back. That is a later problem. For now: read it, flatten it.</p>'
		},
		{
			type: 'assemble',
			act: 'Act 3 · names',
			do: 'The most common surname in Korea. Build <em>gim</em>.',
			hint: 'You will see it romanized as "Kim".',
			target: '김',
			targetName: 'Kim · about 1 in 5 Koreans',
			consonants: ['ㄱ', 'ㅂ', 'ㅈ'],
			vowels: ['ㅣ', 'ㅏ'],
			finals: ['ㅁ', 'ㄴ', 'ㅇ'],
			teach:
				'<p><span class="hg">김</span>. Roughly a fifth of all Koreans.</p><p>Note the mismatch: it is romanized <em>Kim</em>, but the letter is <span class="jamo">ㄱ</span> — closer to a <em>g</em>. Another reason to read the Hangul and distrust the romanization.</p>'
		},
		{
			type: 'assemble',
			act: 'Act 3 · names',
			do: 'Second most common. Build <em>bak</em> — you will see it written "Park".',
			target: '박',
			targetName: 'Park · Bak',
			consonants: ['ㅂ', 'ㅍ', 'ㅁ'],
			vowels: ['ㅏ', 'ㅗ'],
			finals: ['ㄱ', 'ㅋ', 'ㅇ'],
			teach:
				'<p><span class="hg">박</span>. There is no <em>r</em> anywhere in it — "Park" is an English spelling convention, not a transcription.</p><p>You can now read the two most common surnames in Korea, plus <span class="hg">정</span>, <span class="hg">강</span>, <span class="hg">임</span> and most others, because they are all just consonant + vowel + batchim.</p>'
		},
		{
			type: 'read',
			act: 'Act 4 · read it cold',
			do: 'You built the first block two cards ago.',
			blocks: [
				{ block: '김', reading: 'gim' },
				{ block: '치', reading: 'chi' }
			],
			options: ['kimchi', 'kimono', 'kettle', 'kidney'],
			answer: 0,
			teach:
				'<p><strong>gim-chi</strong>. Same <span class="hg">김</span> as the surname — different word, identical block.</p>'
		},
		{
			type: 'read',
			act: 'Act 4 · read it cold',
			do: 'Two blocks, two batchim. One of them is the flattening kind.',
			blocks: [
				{ block: '한', reading: 'han' },
				{ block: '국', reading: 'guk' }
			],
			options: ['Korea', 'Japan', 'China', 'Hanoi'],
			answer: 0,
			teach:
				'<p><strong>han-guk</strong> — Korea. The country, in its own script, read by you from parts.</p>'
		},
		{
			type: 'read',
			act: 'Act 4 · the last one',
			do: 'Same first block. New second block, ending in ㄹ.',
			blocks: [
				{ block: '한', reading: 'han' },
				{ block: '글', reading: 'geul' }
			],
			options: ['alphabet', 'notebook', 'handbook', 'hangover'],
			answer: 0,
			teach:
				'<p><strong>han-geul</strong> — and that is the name of the writing system itself: <span class="hg">한글</span>, "the Korean script".</p><p>Four labs ago you could not read a single letter. You just read the name of the alphabet, off the page, from first principles.</p>'
		}
	]
};
