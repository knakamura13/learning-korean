import type { Lab } from './types';

export const lab01: Lab = {
	id: '0001',
	number: 1,
	title: 'Find the Letters in Your Mouth',
	standfirst:
		'No reading ahead. Each card asks you to do one thing — the explanation only shows up after you have done it.',
	minutes: 9,
	unlocks: 'lab01',
	finish: {
		title: 'You just derived 19 letters from 5 shapes',
		summary:
			'You never memorized a consonant chart. You found five shapes in your own mouth, worked out what a stroke and a doubling mean, built letters from them, and read Korean words nobody taught you. Next lab: vowels — three strokes, one rule, twenty-one letters.'
	},
	steps: [
		/* ---- Act 1: find the five shapes ---- */
		{
			type: 'mouth',
			act: 'Act 1 · 1 of 5',
			do: 'Say <em>mmm</em>. Hold it.',
			hint: 'Something in your mouth is completely closed. Click where.',
			zone: 'labial',
			jamo: 'ㅁ',
			teach:
				'<p>Your lips. Now look at the letter Korean uses for that sound: <span class="jamo">ㅁ</span> — a closed mouth, seen face-on.</p><p>That is not a memory trick invented for learners. It is the original 1443 design.</p>'
		},
		{
			type: 'mouth',
			act: 'Act 1 · 2 of 5',
			do: 'Say <em>g</em>, as in <em>go</em>.',
			hint: 'Where does the air get blocked? It is further back than you think.',
			solved: [{ zone: 'labial', jamo: 'ㅁ' }],
			zone: 'velar',
			jamo: 'ㄱ',
			miss:
				'<p>Further back. The blockage is not at your lips or teeth — it is the back of your tongue against the soft roof of your mouth.</p>',
			teach:
				'<p>The back of your tongue humps up and seals the throat. <span class="jamo">ㄱ</span> is that hump, drawn from the side.</p>'
		},
		{
			type: 'mouth',
			act: 'Act 1 · 3 of 5',
			do: 'Say <em>n</em>. Freeze your tongue where it lands.',
			hint: 'The tip is touching something.',
			solved: [
				{ zone: 'labial', jamo: 'ㅁ' },
				{ zone: 'velar', jamo: 'ㄱ' }
			],
			zone: 'alveolar',
			jamo: 'ㄴ',
			teach:
				'<p>The tip of your tongue is on the ridge just behind your top teeth. <span class="jamo">ㄴ</span> is a tongue, curled up to touch it.</p>'
		},
		{
			type: 'mouth',
			act: 'Act 1 · 4 of 5',
			do: 'Say <em>sss</em>, like a leak.',
			hint: 'Nothing closes. Air is squeezing through a narrow gap — where?',
			solved: [
				{ zone: 'labial', jamo: 'ㅁ' },
				{ zone: 'velar', jamo: 'ㄱ' },
				{ zone: 'alveolar', jamo: 'ㄴ' }
			],
			zone: 'dental',
			jamo: 'ㅅ',
			teach:
				'<p>At your teeth. <span class="jamo">ㅅ</span> is a tooth, pointed — the gap the air hisses through.</p>'
		},
		{
			type: 'mouth',
			act: 'Act 1 · 5 of 5',
			do: 'Say <em>ahhh</em>, like at the doctor.',
			hint: 'Nothing in your mouth blocks anything at all. So where is this one made?',
			solved: [
				{ zone: 'labial', jamo: 'ㅁ' },
				{ zone: 'velar', jamo: 'ㄱ' },
				{ zone: 'alveolar', jamo: 'ㄴ' },
				{ zone: 'dental', jamo: 'ㅅ' }
			],
			zone: 'glottal',
			jamo: 'ㅇ',
			teach:
				'<p>The throat, wide open. <span class="jamo">ㅇ</span> is that circle.</p><p>It is the odd one out: on top of a syllable it is <em>silent</em>, just holding the slot open. You will meet it doing real work later.</p>'
		},

		/* ---- Act 2: derive the rules ---- */
		{
			type: 'choice',
			act: 'Act 2 · the pattern',
			do: 'Five sounds, five places, five shapes. So what does a Hangul consonant’s shape actually encode?',
			stage: [{ glyph: 'ㅁ' }, { glyph: 'ㄱ' }, { glyph: 'ㄴ' }, { glyph: 'ㅅ' }, { glyph: 'ㅇ' }],
			options: [
				'Where in your mouth the sound is made',
				'The order the letter was invented in',
				'How loud the sound is when spoken',
				'A picture of a word starting with it'
			],
			stack: true,
			answer: 0,
			miss:
				'<p>Look back at what you just did — every click was about a <em>place</em>. The shapes are diagrams of your vocal tract.</p>',
			teach:
				'<p>This makes Hangul a <strong>featural</strong> alphabet — the only major script whose letter shapes systematically encode how the sound is produced.</p><p>Five shapes down. Fourteen letters to go, and you will not memorize a single one.</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · rule one',
			do: 'Here is a letter you know, and a letter you don’t. What changed?',
			stage: [
				{ glyph: 'ㄱ', caption: 'you know this' },
				{ glyph: 'ㅋ', caption: 'new' }
			],
			vs: '→',
			options: [
				'One stroke was added',
				'It was rotated over',
				'It was drawn larger',
				'Two strokes were cut'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>One extra line. Same shape underneath, so it is still made in the same place — the back of your tongue.</p><p>Now: what does that line <em>mean</em>?</p>'
		},
		{
			type: 'choice',
			act: 'Act 2 · rule one',
			do: 'Hold your palm in front of your mouth. Say <em>g</em>, then <em>k</em>. What does the added stroke encode?',
			stage: [
				{ glyph: 'ㄱ', caption: 'g' },
				{ glyph: 'ㅋ', caption: 'k' }
			],
			vs: '+',
			options: ['A puff of air', 'A higher pitch', 'A longer sound', 'A louder sound'],
			answer: 0,
			miss: '<p>Try again with your palm closer. Only one of the two moved the air.</p>',
			teach:
				'<p>You felt it. <strong>Add a stroke, add breath</strong> — the sound becomes <em>aspirated</em>.</p><p>That is rule one, and it is the whole rule. Time to use it.</p>'
		},

		/* ---- Act 3: build with rule one ---- */
		{
			type: 'build',
			act: 'Act 3 · build it',
			do: 'Start from <span class="jamo">ㄴ</span>. Reach the puffed <em>t</em>.',
			hint: 'Two presses. Watch what appears in between — that one is a real letter too.',
			start: 'ㄴ',
			target: 'ㅌ',
			targetName: 'aspirated t',
			teach:
				'<p><span class="jamo">ㄴ</span> → <span class="jamo">ㄷ</span> → <span class="jamo">ㅌ</span>. You just built three letters from one shape.</p><p>All three are made in the same place: tongue tip on the ridge. The strokes only add breath.</p>'
		},
		{
			type: 'build',
			act: 'Act 3 · build it',
			do: 'Same rule, the lip family. Start from <span class="jamo">ㅁ</span>, reach the puffed <em>p</em>.',
			start: 'ㅁ',
			target: 'ㅍ',
			targetName: 'aspirated p',
			teach:
				'<p><span class="jamo">ㅁ</span> → <span class="jamo">ㅂ</span> (<em>b</em>) → <span class="jamo">ㅍ</span> (<em>p</em>).</p><p>You can watch the breath being drawn onto the letter.</p>'
		},

		/* ---- Act 4: derive rule two ---- */
		{
			type: 'choice',
			act: 'Act 4 · rule two',
			do: 'Different move this time. What was done to <span class="jamo">ㅂ</span>?',
			stage: [{ glyph: 'ㅂ' }, { glyph: 'ㅃ' }],
			vs: '→',
			options: [
				'It was written twice',
				'A stroke was added',
				'It was flipped over',
				'It was made bolder'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>Doubled. And doubling does <em>not</em> mean a longer or louder sound.</p><p><span class="jamo">ㅃ</span> is <strong>tense</strong>: throat tight, muscles locked, and <em>no</em> puff of air at all — the opposite extreme from aspirated.</p><p>English has no third setting here, so producing it takes months. Recognizing it takes about five seconds, which is all today asks.</p>'
		},
		{
			type: 'build',
			act: 'Act 4 · both rules',
			do: 'Now combine them. From <span class="jamo">ㅅ</span>, reach the tense <em>jj</em>.',
			hint: 'One stroke, then one doubling. Undo is there if you overshoot.',
			start: 'ㅅ',
			target: 'ㅉ',
			targetName: 'tense jj',
			teach:
				'<p><span class="jamo">ㅅ</span> → <span class="jamo">ㅈ</span> → <span class="jamo">ㅉ</span>. Two rules, stacked.</p><p>That is the entire consonant system. Nineteen letters, five shapes, two operations — and you were never handed a chart.</p>'
		},

		/* ---- Act 5: assemble blocks ---- */
		{
			type: 'assemble',
			act: 'Act 5 · stack them',
			do: 'Two new pieces: <span class="jamo">ㅏ</span> says <em>a</em>, <span class="jamo">ㅗ</span> says <em>o</em>. Build <em>ba</em>.',
			hint: 'Korean packs each syllable into one square block. Pick a consonant, pick a vowel.',
			target: '바',
			targetName: 'ba',
			consonants: ['ㅁ', 'ㅂ', 'ㅅ', 'ㅍ'],
			vowels: ['ㅏ', 'ㅗ'],
			teach:
				'<p><span class="jamo">ㅂ</span> + <span class="jamo">ㅏ</span> = <span class="hg">바</span>. Notice the consonant sat on the <em>left</em>.</p><p><span class="jamo">ㅏ</span> is a tall vowel, so there is only room beside it.</p>'
		},
		{
			type: 'assemble',
			act: 'Act 5 · stack them',
			do: 'Now build <em>so</em> — and watch where the consonant goes this time.',
			target: '소',
			targetName: 'so',
			consonants: ['ㅅ', 'ㅈ', 'ㄴ', 'ㅌ'],
			vowels: ['ㅏ', 'ㅗ'],
			teach:
				'<p><span class="hg">소</span> stacks <em>vertically</em>. <span class="jamo">ㅗ</span> is a wide vowel, so the consonant goes on top.</p><p>Tall vowel → consonant beside it. Wide vowel → consonant above it. That is the whole layout rule.</p>'
		},

		/* ---- Act 6: read cold ---- */
		{
			type: 'read',
			act: 'Act 6 · read it cold',
			do: 'Nobody has told you this word. Sound out each block, then tap it to check.',
			blocks: [
				{ block: '피', reading: 'pi' },
				{ block: '자', reading: 'ja' }
			],
			options: ['pizza', 'pasta', 'patio', 'party'],
			answer: 0,
			teach:
				'<p><strong>pi-ja</strong>. Korean has no <em>z</em>, so <span class="jamo">ㅈ</span> carries it.</p><p>You decoded that from first principles. That is the skill — the word was incidental.</p>'
		},
		{
			type: 'read',
			act: 'Act 6 · read it cold',
			do: 'Again. Watch the middle block — it starts with that circle.',
			blocks: [
				{ block: '사', reading: 'sa' },
				{ block: '우', reading: 'u' },
				{ block: '나', reading: 'na' }
			],
			options: ['sauna', 'salsa', 'samba', 'sagas'],
			answer: 0,
			teach:
				'<p><span class="hg">우</span> is <span class="jamo">ㅇ</span> + <span class="jamo">ㅜ</span>, and says only <em>u</em>.</p><p>There is your silent placeholder from Act 1, doing its real job: every block needs a consonant slot filled, so a vowel-initial syllable borrows the throat circle to hold it open.</p>'
		},
		{
			type: 'read',
			act: 'Act 6 · last one',
			do: 'One plain letter, one aspirated. Both of them you built yourself.',
			blocks: [
				{ block: '기', reading: 'gi' },
				{ block: '타', reading: 'ta' }
			],
			options: ['guitar', 'guides', 'gators', 'gutter'],
			answer: 0,
			teach:
				'<p><strong>gi-ta</strong>. <span class="jamo">ㄱ</span> plain, <span class="jamo">ㅌ</span> aspirated — the letter you derived in Act 3.</p><p>Loanwords are the beginner’s gift: Korean spells them phonetically, so decoding letters unlocks thousands of words you already know.</p>'
		}
	]
};
