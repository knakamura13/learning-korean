import type { Lab } from './types';

export const lab06: Lab = {
	id: '0006',
	number: 6,
	title: 'The Letter That Jumps',
	standfirst:
		'You can read every block. Spoken Korean still surprises you. One rule does most of that work — and you already have the pieces.',
	minutes: 10,
	unlocks: 'lab06',
	requires: '0005',
	finish: {
		title: 'Spoken Korean just became readable',
		summary:
			'A batchim plus a placeholder ㅇ is not a mystery any more: the letter jumps, unless it is already ng. Clusters split instead of sacrificing a letter. Isolation flattening reverses. Next: tensification — why 학교 is [학꾜], the other reason a word you can read still surprises your ear.'
	},
	steps: [
		{
			type: 'choice',
			act: 'Act 1 · the mismatch',
			do: 'You can read this. Spoken Korean says the thing on the right. What happened to the ㄱ?',
			stage: [
				{ glyph: '한국어', caption: 'as written' },
				{ glyph: '한구거', caption: 'as said' }
			],
			vs: '→',
			options: [
				'It jumped into the next block',
				'It turned into a vowel',
				'It was deleted as silent',
				'It doubled the last block'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>The <span class="jamo">ㄱ</span> that sat under <span class="hg">국</span> is now the start of <span class="hg">거</span>. <span class="hg">어</span> begins with a placeholder <span class="jamo">ㅇ</span>. The <span class="jamo">ㄱ</span> filled the hole.</p><p>That is the whole rule — next you operate it.</p>'
		},
		{
			type: 'choice',
			act: 'Act 1 · the hole',
			do: 'Why was <span class="hg">어</span> the hole that <span class="jamo">ㄱ</span> could fall into?',
			stage: [{ glyph: '국' }, { glyph: '어' }],
			vs: '+',
			options: [
				'The leading ㅇ is silent',
				'The leading ㅇ says ng',
				'The suffix 어 deletes consonants',
				'Korean always drops final consonants'
			],
			stack: true,
			answer: 0,
			miss: '<p>You met this letter in Lab 01 in two jobs.</p>',
			teach:
				'<p><span class="jamo">ㅇ</span> on top holds the slot open and says nothing. <span class="jamo">ㅇ</span> at the bottom says <span class="rom">ng</span>.</p><p>Liaison is what happens when a real batchim meets a placeholder <span class="jamo">ㅇ</span>.</p>'
		},
		{
			type: 'liaison',
			act: 'Act 2 · do the jump',
			do: 'A batchim, then a placeholder. Make the jump.',
			word: '음악',
			gloss: 'music',
			teach:
				'<p><span class="hg">음</span> + <span class="hg">악</span> → <span class="hg">[으막]</span>.</p><p>The spelling still writes <span class="hg">음</span>, because that is the word. Speech does not care: the <span class="jamo">ㅁ</span> would rather be an onset than an unreleased stop.</p>'
		},
		{
			type: 'liaison',
			act: 'Act 2 · identity',
			do: 'Lab 04 flattened this to <span class="hg">[옫]</span> in isolation. A vowel follows now. Jump the letter that is actually written.',
			word: '옷이',
			gloss: 'clothes + subject particle',
			teach:
				'<p><span class="hg">[오시]</span>, not <span class="hg">[오디]</span>.</p><p>Isolation had to pick one of seven sounds, so <span class="jamo">ㅅ</span> collapsed to <span class="jamo">ㄷ</span>. The spelling kept <span class="jamo">ㅅ</span> so a following vowel could bring the real letter back. That is the aside from Lab 04, paid off.</p>'
		},
		{
			type: 'liaison',
			act: 'Act 2 · identity',
			do: 'Same story, different letter. Lab 04 built this word.',
			word: '밭에',
			gloss: 'in the field',
			teach:
				'<p><span class="hg">[바테]</span>. The <span class="jamo">ㅌ</span> comes back as <span class="jamo">ㅌ</span> — aspiration is allowed again once the letter is on top.</p><p><span class="hg">밭이</span> would go further and palatalize to <span class="hg">[바치]</span>. That is a later rule. <span class="jamo">에</span> keeps this card honest.</p>'
		},
		{
			type: 'liaison',
			act: 'Act 2 · identity',
			do: 'The k-ish family. Jump what is written, not what isolation said.',
			word: '부엌에',
			gloss: 'in the kitchen',
			teach:
				'<p><span class="hg">[부어케]</span>. <span class="jamo">ㅋ</span>, not <span class="jamo">ㄱ</span>.</p><p>Three collapses reversed: <span class="jamo">ㅅ</span>→<span class="jamo">ㄷ</span> undone, <span class="jamo">ㅌ</span>→<span class="jamo">ㄷ</span> undone, <span class="jamo">ㅋ</span>→<span class="jamo">ㄱ</span> undone. Written Korean was telling the truth the whole time.</p>'
		},
		{
			type: 'choice',
			act: 'Act 3 · name the rule',
			do: 'In one sentence, liaison is…',
			options: [
				"A batchim fills the next block's empty ㅇ",
				'A batchim always becomes a new vowel',
				'A silent ㅇ deletes the previous block',
				'Two written blocks fuse into one letter'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><strong>연음</strong>. Korean spelling is morphophonemic: it writes the identity of a piece, not a recording of the sound. Liaison is how speech puts those pieces into pronounceable slots.</p><p>Source: 표준 발음법 Article 13.</p>'
		},
		{
			type: 'liaison',
			act: 'Act 3 · the ㅇ exception',
			do: 'Last letter of <span class="hg">강</span> is <span class="jamo">ㅇ</span>. Jump, or stay?',
			word: '강이',
			gloss: 'river + subject particle',
			teach:
				'<p>Stay. <span class="hg">[강이]</span>, not <span class="hg">[가이]</span>.</p><p>That <span class="jamo">ㅇ</span> is already a sound — <span class="rom">ng</span>. Move it into the next onset and it becomes the silent placeholder, and the ng vanishes. Same letter, two jobs; only the placeholder is a hole.</p>'
		},
		{
			type: 'choice',
			act: 'Act 4 · predict the split',
			do: '<span class="hg">읽다</span> is <span class="hg">[익따]</span> — Rule B, only ㄱ survives. <span class="hg">읽어요</span> has a vowel after the cluster. What happens?',
			stage: [
				{ glyph: '읽다', caption: '[익따]' },
				{ glyph: '읽어요', caption: '?' }
			],
			vs: 'vs',
			options: [
				'Both letters surface — ㄹ stays, ㄱ jumps',
				'Only the ㄱ survives, as in 읽다',
				'Only the ㄹ survives, Rule B flips',
				'The whole cluster deletes into a vowel'
			],
			stack: true,
			answer: 0,
			teach:
				'<p>You do not have to throw a letter away when a vowel is waiting to hold it.</p><p>Isolation Rule A/B was "which one, when you can keep only one." Article 14: the second letter jumps; the first stays as batchim.</p>'
		},
		{
			type: 'liaison',
			act: 'Act 4 · split it',
			do: 'Make the split.',
			word: '읽어요',
			gloss: 'to read (polite)',
			teach:
				'<p><span class="hg">[일거요]</span>. <span class="jamo">ㄹ</span> closes <span class="hg">일</span>; <span class="jamo">ㄱ</span> opens <span class="hg">거</span>.</p><p>Lab 05\'s Rule B still holds before a consonant or a pause. A following <span class="jamo">ㅇ</span> changes the job.</p>'
		},
		{
			type: 'liaison',
			act: 'Act 4 · split it',
			do: 'Lab 05\'s <span class="hg">앉다</span> was <span class="hg">[안따]</span>. Same cluster, now a vowel.',
			word: '앉아',
			gloss: 'sit (informal)',
			teach:
				'<p><span class="hg">[안자]</span>. <span class="jamo">ㄴ</span> stays; <span class="jamo">ㅈ</span> jumps.</p><p>Compare <span class="hg">앉다</span>, where <span class="jamo">ㅈ</span> was thrown away and <span class="hg">다</span> tensed. Same spelling, different neighbor, different spoken form.</p>'
		},
		{
			type: 'choice',
			act: 'Act 5 · the ㅅ clause',
			do: 'Article 14 has one extra clause: when the jumper is ㅅ, it tenses. <span class="hg">없어</span> is…',
			stage: [{ glyph: '없어' }],
			options: ['[업써]', '[업서]', '[업더]', '[언서]'],
			answer: 0,
			miss:
				'<p>The <span class="jamo">ㅅ</span> that <span class="hg">없다</span> threw away comes back — and it comes back tense.</p>',
			teach:
				'<p><span class="hg">[업써]</span>. <span class="jamo">ㅂ</span> stays; <span class="jamo">ㅅ</span> jumps and tenses to <span class="jamo">ㅆ</span>.</p><p>There is no deeper reason — Article 14 just says so. The deck will hold this one.</p>'
		},
		{
			type: 'choice',
			act: 'Act 5 · not this rule',
			do: '<span class="hg">좋아요</span> looks like <span class="jamo">ㅎ</span> should jump into <span class="hg">아</span>. What actually happens?',
			stage: [{ glyph: '좋아요' }],
			options: [
				'The ㅎ vanishes (later rule)',
				'The ㅎ jumps into [조하요]',
				'The ㅎ flattens into a ㄷ',
				'The ㅎ tenses the next sound'
			],
			stack: true,
			answer: 0,
			teach:
				'<p><span class="hg">[조아요]</span> is what you will hear, and it is not liaison. Batchim <span class="jamo">ㅎ</span> before a vowel drops (표준 발음법 Article 12).</p><p>Do not cram it into this rule. Later labs take the rest one at a time.</p>'
		},
		{
			type: 'read',
			act: 'Act 6 · read it cold',
			do: 'Nobody has told you this word today. Sound out each block, then tap it to check.',
			blocks: [
				{ block: '한', reading: 'han' },
				{ block: '국', reading: 'guk' },
				{ block: '어', reading: 'eo' }
			],
			options: ['Korean language', 'Korean grammar', 'Korean history', 'Korean culture'],
			answer: 0,
			teach:
				'<p><strong>han-guk-eo</strong>, said <span class="hg">[한구거]</span>.</p><p>You just read the name of the language you are learning, and you know why it does not sound like the spelling.</p>'
		},
		{
			type: 'read',
			act: 'Act 6 · read it cold',
			do: 'You jumped this one in Act 2. Now read it as a phrase.',
			blocks: [
				{ block: '부', reading: 'bu' },
				{ block: '엌', reading: 'eok' },
				{ block: '에', reading: 'e' }
			],
			options: ['in the kitchen', 'in the hallway', 'in the bathroom', 'in the basement'],
			answer: 0,
			teach:
				'<p><strong>bu-eok-e</strong>, said <span class="hg">[부어케]</span>.</p><p>The <span class="jamo">ㅋ</span> you restored in Act 2, in a phrase you might actually text.</p>'
		},
		{
			type: 'read',
			act: 'Act 6 · the last card',
			do: 'Particle <span class="hg">을</span> marks the object. Read it, then flatten it.',
			blocks: [
				{ block: '한', reading: 'han' },
				{ block: '글', reading: 'geul' },
				{ block: '을', reading: 'eul' }
			],
			options: ['the Korean script', 'the Korean letter', 'the Korean block', 'the Korean vowel'],
			answer: 0,
			teach:
				'<p><strong>han-geul-eul</strong>, said <span class="hg">[한그를]</span>.</p><p>The name of the writing system, as it appears in a real sentence. Liaison is why <span class="hg">을</span> does not sound like a separate "eul" after <span class="hg">글</span>.</p>'
		}
	]
};
