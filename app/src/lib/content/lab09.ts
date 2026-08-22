import type { Lab } from './types';

export const lab09: Lab = {
	id: '0009',
	number: 9,
	title: 'The Flap and the Wall',
	standfirst:
		'ㄴ touching ㄹ always comes out ㄹㄹ — the tongue refuses anything else. But behind a nasal wall of ㅁ or ㅇ, it is ㄹ that gives up and turns into ㄴ.',
	minutes: 10,
	unlocks: 'lab09',
	requires: '0008',
	finish: {
		title: 'Flow, or yield',
		summary:
			'Direct ㄴ·ㄹ contact flows to ㄹㄹ in either order; a lead ㄹ after ㅁ/ㅇ yields to ㄴ. With that, all the drilled sound changes are yours — only palatalization stays reference-only. Next stop: names, and real text.'
	},
	steps: [
		{
			type: 'choice',
			act: 'Act 1 · the mismatch',
			do: 'The old kingdom\'s name. What does the ㄴ do?',
			stage: [
				{ glyph: '신라', caption: 'as written' },
				{ glyph: '실라', caption: 'as said' }
			],
			vs: '→',
			options: [
				'The ㄴ becomes ㄹ, giving a long ㄹㄹ',
				'The ㄹ becomes ㄴ, giving a long ㄴㄴ',
				'The ㄴ jumps into the following block',
				'The ㄴ simply deletes before the ㄹ'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="hg">신</span> ends in <span class="jamo">ㄴ</span>; <span class="hg">라</span> starts with <span class="jamo">ㄹ</span>. Korean never says that sequence — the <span class="jamo">ㄴ</span> assimilates: <span class="hg">[실라]</span>, a long rolled <em>ll</em>.</p>'
		},
		{
			type: 'choice',
			act: 'Act 1 · why',
			do: 'Say <em>n</em>, then flick into <em>r</em>, fast, ten times. Why does Korean refuse it?',
			options: [
				'Both letters live on the same ridge; the flap wins',
				'Both letters live on the lips; the nasal wins there',
				'The two letters are written with an identical shape',
				'The two letters merged in spelling reform long ago'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="jamo">ㄴ</span> and <span class="jamo">ㄹ</span> are both made at the ridge behind your teeth. At speed, holding the nasal and then flapping is too much work — the tongue just holds the <span class="jamo">ㄹ</span>. <strong>유음화</strong>, Article 20.</p>'
		},
		{
			type: 'flow',
			act: 'Act 2 · let it flow',
			do: 'ㄴ meets ㄹ. Operate the junction.',
			word: '신라',
			gloss: 'Silla, the old kingdom',
			teach: '<p><span class="hg">[실라]</span>. History class says it correctly without knowing why.</p>'
		},
		{
			type: 'flow',
			act: 'Act 2 · let it flow',
			do: 'A word you will text people. Operate the junction.',
			word: '연락',
			gloss: 'contact, getting in touch',
			teach:
				'<p><span class="hg">[열락]</span>. <span class="hg">연락해</span> — "text me" — is said with the double <span class="jamo">ㄹ</span>.</p>'
		},
		{
			type: 'flow',
			act: 'Act 2 · let it flow',
			do: 'Same junction, everyday word. Operate it.',
			word: '편리',
			gloss: 'convenience',
			teach: '<p><span class="hg">[펼리]</span>. Convenience stores earn the name.</p>'
		},
		{
			type: 'choice',
			act: 'Act 3 · the other order',
			do: 'Now the ㄹ comes first. What happens to the ㄴ of <span class="hg">날</span>… wait — of <span class="hg">설날</span>?',
			stage: [
				{ glyph: '설날', caption: 'as written' },
				{ glyph: '설랄', caption: 'as said' }
			],
			vs: '→',
			options: [
				'The following ㄴ also becomes an ㄹ',
				'The leading ㄹ becomes an ㄴ instead',
				'The ㄹ jumps forward into the ㄴ block',
				'Nothing at all changes when ㄹ comes first'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>Either order, same outcome: the flap wins. <span class="hg">[설랄]</span> — New Year\'s Day. Article 20 covers both directions.</p>'
		},
		{
			type: 'flow',
			act: 'Act 3 · let it flow',
			do: 'ㄹ first this time. Operate the junction.',
			word: '설날',
			gloss: 'Lunar New Year’s Day',
			teach: '<p><span class="hg">[설랄]</span>. The holiday everyone mispronounces from the spelling.</p>'
		},
		{
			type: 'flow',
			act: 'Act 3 · let it flow',
			do: 'Same order, indoor voice. Operate the junction.',
			word: '실내',
			gloss: 'indoors',
			teach: '<p><span class="hg">[실래]</span>. Gym signs everywhere: <span class="hg">실내화</span>, indoor shoes.</p>'
		},
		{
			type: 'choice',
			act: 'Act 3 · name it',
			do: 'In one sentence, lateralization is…',
			options: [
				'ㄴ touching ㄹ comes out as a long ㄹㄹ',
				'ㄹ touching ㄴ comes out as a long ㄴㄴ',
				'ㄴ before ㄹ swaps places with the vowel',
				'ㄹ after ㄴ always deletes itself from speech'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><strong>유음화</strong> — "becoming liquid". Direct contact, either order, and the ridge holds the flap.</p>'
		},
		{
			type: 'choice',
			act: 'Act 4 · the wall',
			do: 'Different first letter now. Why doesn\'t this one flow?',
			stage: [
				{ glyph: '심리', caption: 'as written' },
				{ glyph: '심니', caption: 'as said' }
			],
			vs: '→',
			options: [
				'ㅁ blocks the flow, so the ㄹ yields to ㄴ',
				'ㅁ also becomes an ㄹ, giving a long ㄹㄹ',
				'The ㄹ jumps backward into the ㅁ batchim block',
				'The ㅁ deletes and the ㄹ stays as it is'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="jamo">ㅁ</span> and <span class="jamo">ㅇ</span> are nasals made elsewhere in the mouth — a wall the flap cannot roll through. So the <span class="jamo">ㄹ</span> gives up and becomes the nearest ridge nasal: <span class="jamo">ㄴ</span>. <span class="hg">[심니]</span>. Article 19.</p>'
		},
		{
			type: 'flow',
			act: 'Act 4 · make it yield',
			do: 'A lead ㄹ behind the wall. Operate the junction.',
			word: '심리',
			gloss: 'psychology',
			teach: '<p><span class="hg">[심니]</span>. The <span class="jamo">ㄹ</span> yields.</p>'
		},
		{
			type: 'flow',
			act: 'Act 4 · make it yield',
			do: 'A Seoul street you will walk. Operate the junction.',
			word: '종로',
			gloss: 'Jongno, a Seoul district',
			teach:
				'<p><span class="hg">[종노]</span>. Every subway announcement says it this way; the signage romanizes it <em>Jongno</em> for exactly this reason.</p>'
		},
		{
			type: 'flow',
			act: 'Act 4 · make it yield',
			do: 'Something to order with dinner. Operate the junction.',
			word: '음료수',
			gloss: 'a beverage',
			teach: '<p><span class="hg">[음뇨수]</span>. Menus everywhere.</p>'
		},
		{
			type: 'flow',
			act: 'Act 5 · Stay sharp',
			do: 'Careful — look at what follows the ㄹ before you touch anything.',
			word: '물이',
			gloss: 'the water (subject)',
			teach:
				'<p>The <span class="jamo">ㄹ</span> sits before a vowel — that junction is Lab 06\'s: it jumps, <span class="hg">[무리]</span>. Nothing in <em>this</em> lab fires without ㄴ contact or a nasal wall.</p>'
		},
		{
			type: 'choice',
			act: 'Act 5 · flow vs yield',
			do: 'Both words put ㄹ at a junction. Why do they part ways?',
			stage: [{ glyph: '신라' }, { glyph: '심리' }],
			vs: 'vs',
			options: [
				'Direct ㄴ contact flows; a ㅁ/ㅇ wall makes ㄹ yield',
				'Direct ㄴ contact yields; a ㅁ/ㅇ wall makes ㄹ flow',
				'The first word is native and the second is borrowed',
				'The first word is longer so the rule works backward'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>Same ridge → the flap wins. Different place → the nasal wins. The neighbor decides, one more time. That instinct is now the whole drilled system.</p>'
		},
		{
			type: 'read',
			act: 'Act 6 · the last card',
			do: 'You made this yield in Act 4… at presidential scale. Read it as a word.',
			blocks: [
				{ block: '대', reading: 'dae' },
				{ block: '통', reading: 'tong' },
				{ block: '령', reading: 'ryeong' }
			],
			options: ['the president', 'the professor', 'the announcer', 'the ambassador'],
			answer: 0,
			teach:
				'<p><strong>dae-tong-ryeong</strong>, said <span class="hg">[대통녕]</span>. Every one of the eight sound changes the news reader uses, you now operate on purpose — palatalization stays on the reference page until its own lab.</p>'
		}
	]
};
