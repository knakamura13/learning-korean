/**
 * words.ts — the real-word corpus behind the vocabulary packs.
 *
 * Selection rules, in priority order:
 * 1. Words from the mission's life: names and address terms, food and menus,
 *    the vocabulary of actual text messages, and signs a visitor reads.
 * 2. Every entry's `spoken` form is authored AND derived: the corpus test
 *    asserts `pronounceWord(hangul) === spoken` for every word, so an entry
 *    whose pronunciation needs a rule the engine does not model
 *    (ㄴ-insertion 서울역, stop-host ㄹ chains 독립, palatalization 같이)
 *    cannot ship. Choose a different word instead of weakening the check.
 * 3. Single words only — spaces break block-cut romanization.
 *
 * A word already carried by a lab pron tier (학교, 국밥, 좋아요, …) still
 * gets a meaning card here but never a second pronunciation card.
 */

export type PackId = 'vocab-names' | 'vocab-food' | 'vocab-phrases' | 'vocab-places';

export interface WordEntry {
	hangul: string;
	/** The pronounced form — must equal pronounceWord(hangul); tested. */
	spoken: string;
	/** Accepted typed meanings; the first is canonical and shown on reveal. */
	glosses: string[];
	pack: PackId;
	note?: string;
}

const w = (
	hangul: string,
	spoken: string,
	glosses: string[],
	pack: PackId,
	note?: string
): WordEntry => ({ hangul, spoken, glosses, pack, note });

export const WORDS: WordEntry[] = [
	/* ---------- names & address (20) ---------- */
	w('김', '김', ['kim'], 'vocab-names', 'The most common surname — a fifth of Korea.'),
	w('이', '이', ['lee', 'yi', 'i'], 'vocab-names', 'Second most common; romanized Lee, said [이].'),
	w('박', '박', ['park', 'bak'], 'vocab-names', 'Romanized Park; there is no r in it.'),
	w('최', '최', ['choi', 'choe'], 'vocab-names', 'Romanized Choi; said [최], one syllable.'),
	w('정', '정', ['jeong', 'jung'], 'vocab-names', 'Romanized Jeong or Jung.'),
	w('강', '강', ['kang', 'gang'], 'vocab-names', 'Also the word for river.'),
	w('조', '조', ['cho', 'jo'], 'vocab-names'),
	w('윤', '윤', ['yoon', 'yun'], 'vocab-names'),
	w('장', '장', ['jang', 'chang'], 'vocab-names'),
	w('임', '임', ['lim', 'im'], 'vocab-names', 'Romanized Lim or Im.'),
	w('씨', '씨', ['mr', 'ms', 'mr/ms'], 'vocab-names', 'Polite name suffix: 민준 씨.'),
	w('님', '님', ['honored', 'sir', 'honorific'], 'vocab-names', 'The higher honorific suffix: 선생님, 고객님.'),
	w('친구', '친구', ['friend'], 'vocab-names'),
	w('엄마', '엄마', ['mom', 'mother'], 'vocab-names'),
	w('아빠', '아빠', ['dad', 'father'], 'vocab-names'),
	w('언니', '언니', ['older sister'], 'vocab-names', 'Used by women; also friendly address.'),
	w('오빠', '오빠', ['older brother'], 'vocab-names', 'Used by women.'),
	w('형', '형', ['older brother'], 'vocab-names', 'Used by men.'),
	w('누나', '누나', ['older sister'], 'vocab-names', 'Used by men.'),
	w('선생님', '선생님', ['teacher'], 'vocab-names'),

	/* ---------- food & menus (30) ---------- */
	w('김치', '김치', ['kimchi'], 'vocab-food'),
	w('밥', '밥', ['rice', 'meal', 'cooked rice'], 'vocab-food', 'Also "a meal" — 밥 먹었어?'),
	w('물', '물', ['water'], 'vocab-food'),
	w('불고기', '불고기', ['bulgogi', 'grilled beef'], 'vocab-food'),
	w('라면', '라면', ['ramyeon', 'ramen', 'instant noodles'], 'vocab-food'),
	w('치킨', '치킨', ['chicken', 'fried chicken'], 'vocab-food'),
	w('피자', '피자', ['pizza'], 'vocab-food'),
	w('커피', '커피', ['coffee'], 'vocab-food'),
	w('우유', '우유', ['milk'], 'vocab-food'),
	w('사과', '사과', ['apple', 'apology'], 'vocab-food', 'Also "apology" — same word.'),
	w('계란', '계란', ['egg'], 'vocab-food'),
	w('고기', '고기', ['meat'], 'vocab-food'),
	w('생선', '생선', ['fish'], 'vocab-food'),
	w('야채', '야채', ['vegetable', 'vegetables'], 'vocab-food'),
	w('소금', '소금', ['salt'], 'vocab-food'),
	w('설탕', '설탕', ['sugar'], 'vocab-food'),
	w('반찬', '반찬', ['side dish', 'side dishes'], 'vocab-food'),
	w('국밥', '국빱', ['rice soup', 'soup with rice'], 'vocab-food', 'The stop tenses the ㅂ: [국빱].'),
	w('떡볶이', '떡뽀끼', ['tteokbokki', 'spicy rice cakes'], 'vocab-food', 'Tensification then liaison: [떡뽀끼].'),
	w('맥주', '맥쭈', ['beer'], 'vocab-food', 'Tensified: [맥쭈].'),
	w('소주', '소주', ['soju'], 'vocab-food'),
	w('식당', '식땅', ['restaurant'], 'vocab-food', 'Tensified: [식땅].'),
	w('맛집', '맏찝', ['good restaurant', 'famous restaurant'], 'vocab-food', 'The find-of-the-day word: [맏찝].'),
	w('젓가락', '젇까락', ['chopsticks'], 'vocab-food', 'ㅅ flattens, then tenses the ㄱ: [젇까락].'),
	w('숟가락', '숟까락', ['spoon'], 'vocab-food'),
	w('물냉면', '물랭면', ['cold noodle soup', 'mul naengmyeon'], 'vocab-food', 'ㄹ+ㄴ flows: [물랭면].'),
	w('갈비', '갈비', ['ribs', 'galbi'], 'vocab-food'),
	w('만두', '만두', ['dumpling', 'dumplings'], 'vocab-food'),
	w('김치찌개', '김치찌개', ['kimchi stew'], 'vocab-food'),
	w('냉면', '냉면', ['cold noodles', 'naengmyeon'], 'vocab-food'),

	/* ---------- messages & phrases (25) ---------- */
	w('네', '네', ['yes', 'okay', 'ok'], 'vocab-phrases'),
	w('아니요', '아니요', ['no'], 'vocab-phrases'),
	w('감사합니다', '감사함니다', ['thank you', 'thanks'], 'vocab-phrases', 'Nasalized: [감사함니다].'),
	w('안녕하세요', '안녕하세요', ['hello', 'hi'], 'vocab-phrases'),
	w('미안해', '미안해', ['sorry', 'im sorry'], 'vocab-phrases', 'Casual — for friends.'),
	w('미안합니다', '미안함니다', ['i am sorry', 'sorry, formal'], 'vocab-phrases', 'Formal: [미안함니다].'),
	w('괜찮아요', '괜차나요', ['its okay', 'it is okay', 'im fine'], 'vocab-phrases', 'ㅎ deletes and ㄴ jumps: [괜차나요].'),
	w('좋아요', '조아요', ['its good', 'it is good', 'i like it'], 'vocab-phrases', 'The like button: [조아요].'),
	w('주세요', '주세요', ['please give me', 'please'], 'vocab-phrases', 'Attach to anything on a menu.'),
	w('얼마예요', '얼마예요', ['how much is it', 'how much'], 'vocab-phrases'),
	w('알겠습니다', '알겓씀니다', ['understood', 'got it, formal'], 'vocab-phrases', 'Two rules chain: [알겓씀니다].'),
	w('고맙습니다', '고맙씀니다', ['thank you', 'thanks'], 'vocab-phrases', 'Native twin of 감사합니다: [고맙씀니다].'),
	w('사랑해', '사랑해', ['i love you'], 'vocab-phrases'),
	w('있어요', '이써요', ['there is', 'i have', 'it exists'], 'vocab-phrases', 'Liaison: [이써요].'),
	w('없어요', '업써요', ['there is not', 'i dont have'], 'vocab-phrases', 'The cluster splits: [업써요].'),
	w('몰라요', '몰라요', ['i dont know'], 'vocab-phrases'),
	w('알아요', '아라요', ['i know'], 'vocab-phrases', 'Liaison: [아라요].'),
	w('맞아요', '마자요', ['thats right', 'correct'], 'vocab-phrases', 'Liaison: [마자요].'),
	w('축하해', '추카해', ['congratulations', 'congrats'], 'vocab-phrases', 'Aspiration: [추카해].'),
	w('생일', '생일', ['birthday'], 'vocab-phrases'),
	w('내일', '내일', ['tomorrow'], 'vocab-phrases'),
	w('오늘', '오늘', ['today'], 'vocab-phrases'),
	w('지금', '지금', ['now'], 'vocab-phrases'),
	w('사랑', '사랑', ['love'], 'vocab-phrases'),
	w('어디', '어디', ['where'], 'vocab-phrases'),

	/* ---------- signs & places (25) ---------- */
	w('서울', '서울', ['seoul'], 'vocab-places'),
	w('부산', '부산', ['busan'], 'vocab-places'),
	w('한국', '한국', ['korea', 'south korea'], 'vocab-places'),
	w('학교', '학꾜', ['school'], 'vocab-places', 'Tensified: [학꾜].'),
	w('집', '집', ['house', 'home'], 'vocab-places'),
	w('회사', '회사', ['company', 'office', 'work'], 'vocab-places'),
	w('병원', '병원', ['hospital'], 'vocab-places'),
	w('약국', '약꾹', ['pharmacy'], 'vocab-places', 'Tensified: [약꾹].'),
	w('화장실', '화장실', ['bathroom', 'restroom', 'toilet'], 'vocab-places'),
	w('지하철', '지하철', ['subway'], 'vocab-places'),
	w('버스', '버스', ['bus'], 'vocab-places'),
	w('택시', '택씨', ['taxi'], 'vocab-places', 'Tensified: [택씨].'),
	w('공항', '공항', ['airport'], 'vocab-places'),
	w('역', '역', ['station'], 'vocab-places'),
	w('입구', '입꾸', ['entrance'], 'vocab-places', 'Tensified: [입꾸].'),
	w('출구', '출구', ['exit'], 'vocab-places', 'The sign you follow out of every station.'),
	w('은행', '은행', ['bank'], 'vocab-places'),
	w('시장', '시장', ['market'], 'vocab-places'),
	w('가게', '가게', ['store', 'shop'], 'vocab-places'),
	w('길', '길', ['road', 'street', 'way'], 'vocab-places'),
	w('문', '문', ['door', 'gate'], 'vocab-places'),
	w('백화점', '배콰점', ['department store'], 'vocab-places', 'Aspiration: [배콰점].'),
	w('학원', '하권', ['academy', 'cram school'], 'vocab-places', 'Liaison: [하권].'),
	w('대학교', '대학꾜', ['university', 'college'], 'vocab-places', 'Tensified: [대학꾜].'),
	w('공원', '공원', ['park'], 'vocab-places')
];

export interface VocabPack {
	id: PackId;
	label: string;
	standfirst: string;
}

export const VOCAB_PACKS: VocabPack[] = [
	{
		id: 'vocab-names',
		label: 'Names & people',
		standfirst: 'Surnames and the words Koreans call each other.'
	},
	{
		id: 'vocab-food',
		label: 'Food & menus',
		standfirst: 'Everything you will actually order.'
	},
	{
		id: 'vocab-phrases',
		label: 'Messages',
		standfirst: 'The words real texts are made of.'
	},
	{
		id: 'vocab-places',
		label: 'Signs & places',
		standfirst: 'What the street is telling you.'
	}
];

export function wordsOfPack(pack: PackId): WordEntry[] {
	return WORDS.filter((word) => word.pack === pack);
}
