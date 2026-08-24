import type { Lab } from './types';

export const lab10: Lab = {
	id: '0010',
	number: 10,
	title: 'The Names in Your Phone',
	standfirst:
		'A full Korean name is a shape: family name first, no space, and every junction rule you have drilled fires inside it. Then come the suffixes people are actually called by — 아, 야, 씨, 님.',
	minutes: 10,
	unlocks: 'lab10',
	requires: '0009',
	finish: {
		title: 'The people half, closed',
		summary:
			'Family name first, one syllable plus two, no space — and a name obeys every junction rule you know. 아/야 calls a close friend your age or younger, and 아 hands a batchim name a vowel to liaise into; 씨 takes the full or given name, never a bare surname; 님 honors roles and titles. Reading the people in your life was the mission\'s second half. Left on the bench: handwriting, and the romanization traps.'
	},
	phases: [
		{ title: 'The family name is the first syllable', count: 2 },
		{ title: 'Sound changes still apply inside a name', count: 6 },
		{ title: 'The close-friend name suffixes', count: 4 },
		{ title: 'The polite suffix and the honorific', count: 3 },
		{ title: 'Read from the letters alone', count: 2 },
	],
	steps: [

		/* ---- The family name is the first syllable ---- */
		{
			type: 'choice',
			do: 'A friend saves a contact as <span class="hg">김민준</span>. One block is the family name. Which?',
			stage: [{ glyph: '김민준', caption: 'a full name' }],
			options: [
				'the first block, 김',
				'the last block, 준',
				'the middle block, 민',
				'the whole name, 김민준'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>Family name first, always — <span class="hg">김</span> before everything, the reverse of English order. The vocabulary pack\'s ten surnames (<span class="hg">김</span>, <span class="hg">이</span>, <span class="hg">박</span>, …) are the first block of most names you will ever read.</p>'
		},
		{
			type: 'choice',
			do: 'Three real names. What shape do they share?',
			stage: [{ glyph: '김민준' }, { glyph: '이서연' }, { glyph: '박지훈' }],
			options: [
				'one syllable of surname, two of given name',
				'two syllables of surname, one of given name',
				'surname and given name split by a space',
				'surname last, exactly like an English name'
			],
			stack: true,
			answer: 0,
			miss: '<p>Step 1 already placed the family name. Count what is left.</p>',
			teach:
				'<p>1 + 2 is the dominant shape: one-syllable surname, two-syllable given name, written with no space. Two-syllable surnames (<span class="hg">남궁</span>) and one-syllable given names exist — they are just rare. Three blocks, no gap: you are probably looking at a person.</p>'
		},

		/* ---- Sound changes still apply inside a name ---- */
		{
			type: 'choice',
			do: 'Spelling vs speech. You have drilled every junction rule — which one fired here?',
			stage: [
				{ glyph: '박은지', caption: 'as written' },
				{ glyph: '바근지', caption: 'as said' }
			],
			vs: '→',
			options: ['liaison', 'tensification', 'nasalization', 'aspiration'],
			answer: 0,
			miss: '<p>Look at what <span class="hg">은</span> starts with.</p>',
			teach:
				'<p>A name is not exempt. <span class="hg">박</span> ends in <span class="jamo">ㄱ</span>; <span class="hg">은</span> opens with an empty <span class="jamo">ㅇ</span>. The <span class="jamo">ㄱ</span> jumps, exactly as in Lab 06: <span class="hg">[바근지]</span>.</p>'
		},
		{
			type: 'liaison',
			do: 'A batchim surname, a vowel-initial given name. Operate the junction.',
			word: '박은지',
			gloss: 'a full name',
			teach:
				'<p><span class="hg">[바근지]</span>. The romanization <em>Park Eun-ji</em> preserves the blocks; the mouth does not.</p>'
		},
		{
			type: 'contact',
			do: 'Same surname, a different neighbor. Operate the junction.',
			word: '박보검',
			gloss: 'an actor\'s name',
			teach:
				'<p><span class="hg">[박뽀검]</span>. A stop then plain <span class="jamo">ㅂ</span> tenses — Lab 07 inside a celebrity. Park Bo-gum is said <em>bak-ppo-geom</em>.</p>'
		},
		{
			type: 'contact',
			do: 'Same surname again, now before <span class="jamo">ㄴ</span>. Operate the junction.',
			word: '박나래',
			gloss: 'a comedian\'s name',
			teach:
				'<p><span class="hg">[방나래]</span>. <span class="jamo">ㄱ</span> before <span class="jamo">ㄴ</span> nasalizes. <em>Park</em> reaches your ear as <em>bang</em> — no romanization warned you.</p>'
		},
		{
			type: 'hmerge',
			do: 'The given name starts with <span class="jamo">ㅎ</span>. Operate the junction.',
			word: '김백현',
			gloss: 'a full name',
			teach:
				'<p><span class="hg">[김배켠]</span>. <span class="jamo">ㄱ</span> + <span class="jamo">ㅎ</span> fuse into <span class="jamo">ㅋ</span> — Lab 08 inside a name. <em>Baek-hyun</em> is said <em>bae-kyeon</em>.</p>'
		},
		{
			type: 'choice',
			do: 'One surname, three sounds: <span class="hg">박</span>, <span class="hg">[방]</span>, <span class="hg">[바]</span>. Why does romanized <em>Park</em> mislead?',
			options: [
				'names run through the same junction rules',
				'names freeze the sound their spelling shows',
				'names pick their junction rules at random',
				'names drop their batchim before every vowel'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>A name is ordinary Korean at every junction. <em>Park</em> is a citation form; the neighbor decides what <span class="hg">박</span> actually says. That is why a name you know can still surprise you out loud.</p><p>One class bends: a given name starting <span class="hg">이</span>/<span class="hg">여</span>/<span class="hg">유</span> after a batchim surname often inserts an <span class="jamo">ㄴ</span> — <span class="hg">김연아</span> is <span class="hg">[김녀나]</span>, not what liaison predicts. That class stays off your deck until its rule gets a lab.</p>'
		},

		/* ---- The close-friend name suffixes ---- */
		{
			type: 'choice',
			do: 'A text arrives: <span class="hg">하늘아!!</span> — and 하늘 is the person being texted. What is the extra <span class="hg">아</span>?',
			stage: [{ glyph: '하늘아', caption: 'the text' }],
			options: [
				'a calling suffix for close friends',
				'a politeness marker like the 씨',
				'a spelling of a stretched vowel',
				'a typo the phone slipped in'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>The vocative. A bare name plus <span class="hg">아</span> means <em>hey, 하늘</em> — for close friends your age or younger, never upward. You do not call a beloved <span class="hg">형</span> or a boss this way, however close.</p>'
		},
		{
			type: 'liaison',
			do: 'The vocative hands <span class="hg">늘</span> a vowel. Operate the junction.',
			word: '하늘아',
			gloss: 'hey, 하늘!',
			teach:
				'<p><span class="hg">[하느라]</span>. The <span class="jamo">ㄹ</span> jumps. Every consonant-final name does this when called.</p>'
		},
		{
			type: 'liaison',
			do: 'A close friend calls 민준. Operate the junction.',
			word: '민준아',
			gloss: 'hey, 민준!',
			teach:
				'<p><span class="hg">[민주나]</span>. <span class="hg">민준</span> on the contact card, <em>min-ju-na</em> across the room.</p>'
		},
		{
			type: 'choice',
			do: '<span class="hg">지우</span> ends in a vowel. A close friend calls her…',
			options: ['지우야', '지우아', '지우 씨', '지우 님'],
			answer: 0,
			miss: '<p><span class="hg">아</span> needs a batchim to make sense of. <span class="hg">지우</span> has none.</p>',
			teach:
				'<p><span class="hg">야</span> after a vowel, <span class="hg">아</span> after a batchim — the pair exists so the call always flows. <span class="hg">지우야</span> says exactly what it writes: nothing to jump.</p>'
		},

		/* ---- The polite suffix and the honorific ---- */
		{
			type: 'choice',
			do: 'Your coworker is <span class="hg">김은지</span> — friendly, but not a friend. One of these belittles her. Which?',
			options: ['김 씨', '김은지 씨', '은지 씨', '은지 언니'],
			answer: 0,
			miss: '<p><span class="hg">씨</span> itself is fine — the question is what it is allowed to attach to.</p>',
			teach:
				'<p><span class="hg">씨</span> attaches to the full name or the given name — <span class="hg">김은지 씨</span>, <span class="hg">은지 씨</span> — never the bare surname. Calling someone <span class="hg">김 씨</span> to their face reads like a boss addressing hired help. The classic learner mistake, now yours to skip.</p>'
		},
		{
			type: 'choice',
			do: 'A teacher is <span class="hg">선생님</span>; every store text calls you <span class="hg">고객님</span>. What is <span class="hg">님</span> doing?',
			stage: [
				{ glyph: '선생님', caption: 'teacher' },
				{ glyph: '고객님', caption: 'customer' }
			],
			options: [
				'raising the honor a step above 씨',
				'lowering the honor a step below 씨',
				'marking the person as a total stranger',
				'marking the person as your own family'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="hg">님</span> is the ceiling: it attaches to roles and titles (<span class="hg">선생님</span>, <span class="hg">사장님</span>, <span class="hg">고객님</span>) and, online, straight to names. When unsure, reach upward — too much <span class="hg">님</span> reads formal, never hostile.</p>'
		},
		{
			type: 'contact',
			do: 'The word every store text opens with. Operate the junction.',
			word: '고객님',
			gloss: 'dear customer',
			teach:
				'<p><span class="hg">[고갱님]</span>. <span class="jamo">ㄱ</span> before <span class="jamo">ㄴ</span> nasalizes — Lab 07, hiding inside the honorific itself.</p>'
		},

		/* ---- Read from the letters alone ---- */
		{
			type: 'read',
			do: 'The blocks read as written — which cuts does the mouth actually say?',
			blocks: [
				{ block: '박', reading: 'bak' },
				{ block: '은', reading: 'eun' },
				{ block: '지', reading: 'ji' }
			],
			options: ['ba-geun-ji', 'bak-eun-ji', 'bang-eun-ji', 'ba-geun-chi'],
			answer: 0,
			teach:
				'<p><strong>ba-geun-ji</strong> — the <span class="jamo">ㄱ</span> jumped, cold, without the widget. The spelling holds the name; your mouth holds the liaison. The deck will keep both.</p>'
		},
		{
			type: 'read',
			do: 'Read it as an address.',
			blocks: [
				{ block: '고', reading: 'go' },
				{ block: '객', reading: 'gaek' },
				{ block: '님', reading: 'nim' }
			],
			options: ['dear customer', 'dear teacher', 'dear director', 'dear neighbor'],
			answer: 0,
			teach:
				'<p><strong>go-gaek-nim</strong>, said <span class="hg">[고갱님]</span>. Names, calls, and the suffixes around them — the people in your messages read now. That was the mission\'s second half.</p>'
		}
	]
};
