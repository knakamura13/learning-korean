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

export type PackId =
	| 'vocab-names'
	| 'vocab-food'
	| 'vocab-phrases'
	| 'vocab-places'
	| 'vocab-time'
	| 'vocab-verbs'
	| 'vocab-feelings';

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
	w('공원', '공원', ['park'], 'vocab-places'),

	/* ---------- time & dates (22) ---------- */
	w('월요일', '워료일', ['monday'], 'vocab-time', 'Liaison: [워료일].'),
	w('화요일', '화요일', ['tuesday'], 'vocab-time'),
	w('수요일', '수요일', ['wednesday'], 'vocab-time'),
	w('목요일', '모교일', ['thursday'], 'vocab-time', 'Liaison: [모교일].'),
	w('금요일', '그묘일', ['friday'], 'vocab-time', 'Liaison: [그묘일].'),
	w('토요일', '토요일', ['saturday'], 'vocab-time'),
	w('일요일', '이료일', ['sunday'], 'vocab-time', 'Liaison: [이료일].'),
	w('주말', '주말', ['weekend'], 'vocab-time'),
	w('아침', '아침', ['morning', 'breakfast'], 'vocab-time', 'Also "breakfast" — the meal takes the hour\'s name.'),
	w('점심', '점심', ['lunch', 'lunchtime', 'noon'], 'vocab-time'),
	w('저녁', '저녁', ['evening', 'dinner'], 'vocab-time', 'Also "dinner", like 아침.'),
	w('밤', '밤', ['night', 'chestnut'], 'vocab-time', 'Also "chestnut" — context decides.'),
	w('시간', '시간', ['time', 'hour'], 'vocab-time'),
	w('분', '분', ['minute'], 'vocab-time'),
	w('년', '년', ['year'], 'vocab-time'),
	w('달', '달', ['month', 'moon'], 'vocab-time', 'Also "moon" — months once followed it.'),
	w('매일', '매일', ['every day', 'everyday', 'daily'], 'vocab-time'),
	w('언제', '언제', ['when'], 'vocab-time'),
	w('어제', '어제', ['yesterday'], 'vocab-time'),
	w('오전', '오전', ['am', 'a.m.', 'morning', 'before noon'], 'vocab-time'),
	w('오후', '오후', ['afternoon', 'pm', 'p.m.'], 'vocab-time'),
	w('날짜', '날짜', ['date'], 'vocab-time'),

	/* ---------- verbs people text (22) ---------- */
	w('가요', '가요', ['go', 'i go', 'im going'], 'vocab-verbs'),
	w('와요', '와요', ['come', 'i come', 'im coming'], 'vocab-verbs'),
	w('봐요', '봐요', ['see', 'look', 'watch'], 'vocab-verbs'),
	w('해요', '해요', ['do', 'i do'], 'vocab-verbs'),
	w('먹어요', '머거요', ['eat', 'i eat'], 'vocab-verbs', 'Liaison: [머거요].'),
	w('마셔요', '마셔요', ['drink', 'i drink'], 'vocab-verbs'),
	w('자요', '자요', ['sleep', 'i sleep', 'go to sleep'], 'vocab-verbs'),
	w('일어나요', '이러나요', ['get up', 'wake up', 'i get up'], 'vocab-verbs', 'Liaison: [이러나요].'),
	w('만나요', '만나요', ['meet', 'i meet', 'lets meet'], 'vocab-verbs'),
	w('기다려요', '기다려요', ['wait', 'i wait', 'im waiting'], 'vocab-verbs'),
	w('도착해요', '도차캐요', ['arrive', 'i arrive', 'im arriving'], 'vocab-verbs', 'Aspiration: [도차캐요].'),
	w('살아요', '사라요', ['live', 'i live'], 'vocab-verbs', 'Liaison: [사라요].'),
	w('웃어요', '우서요', ['laugh', 'smile', 'i laugh'], 'vocab-verbs', 'ㅅ revives before the vowel: [우서요].'),
	w('울어요', '우러요', ['cry', 'i cry'], 'vocab-verbs', 'Liaison: [우러요].'),
	w('앉아요', '안자요', ['sit', 'sit down', 'i sit'], 'vocab-verbs', 'The cluster splits: [안자요].'),
	w('사요', '사요', ['buy', 'i buy'], 'vocab-verbs'),
	w('줘요', '줘요', ['give', 'give me'], 'vocab-verbs', 'The casual twin of 주세요.'),
	w('배워요', '배워요', ['learn', 'i learn', 'im learning'], 'vocab-verbs'),
	w('보내요', '보내요', ['send', 'i send'], 'vocab-verbs'),
	w('받아요', '바다요', ['receive', 'get', 'i get'], 'vocab-verbs', 'Liaison: [바다요].'),
	w('놀아요', '노라요', ['play', 'hang out'], 'vocab-verbs', 'Liaison: [노라요].'),
	w('걸어요', '거러요', ['walk', 'i walk'], 'vocab-verbs', 'Liaison: [거러요].'),

	/* ---------- feelings & reactions (21) ---------- */
	w('행복해요', '행보캐요', ['happy', 'im happy'], 'vocab-feelings', 'Aspiration: [행보캐요].'),
	w('슬퍼요', '슬퍼요', ['sad', 'im sad'], 'vocab-feelings'),
	w('화나요', '화나요', ['angry', 'mad', 'im angry'], 'vocab-feelings'),
	w('피곤해요', '피곤해요', ['tired', 'im tired'], 'vocab-feelings'),
	w('배고파요', '배고파요', ['hungry', 'im hungry'], 'vocab-feelings'),
	w('재미있어요', '재미이써요', ['fun', 'its fun', 'interesting'], 'vocab-feelings', 'Liaison: [재미이써요].'),
	w('심심해요', '심심해요', ['bored', 'im bored'], 'vocab-feelings'),
	w('무서워요', '무서워요', ['scared', 'scary', 'im scared'], 'vocab-feelings'),
	w('대박', '대박', ['awesome', 'amazing', 'daebak'], 'vocab-feelings', 'Literally "jackpot" — the all-purpose wow.'),
	w('진짜', '진짜', ['really', 'seriously', 'real'], 'vocab-feelings', 'Statement or protest, tone decides.'),
	w('완전', '완전', ['totally', 'completely'], 'vocab-feelings'),
	w('아이고', '아이고', ['oh no', 'oh my', 'oops'], 'vocab-feelings', 'The all-purpose sigh — pain, surprise, sympathy.'),
	w('헐', '헐', ['omg', 'no way', 'what'], 'vocab-feelings', 'One syllable of pure shock.'),
	w('신나요', '신나요', ['excited', 'im excited'], 'vocab-feelings'),
	w('궁금해요', '궁금해요', ['curious', 'im curious', 'i wonder'], 'vocab-feelings'),
	w('걱정돼요', '걱쩡돼요', ['worried', 'im worried'], 'vocab-feelings', 'Tensified: [걱쩡돼요].'),
	w('힘들어요', '힘드러요', ['its hard', 'exhausted', 'im struggling'], 'vocab-feelings', 'Liaison: [힘드러요].'),
	w('짜증나요', '짜증나요', ['annoyed', 'annoying', 'im annoyed'], 'vocab-feelings'),
	w('부러워요', '부러워요', ['jealous', 'envious', 'im jealous'], 'vocab-feelings'),
	w('최고', '최고', ['the best', 'best', 'number one'], 'vocab-feelings'),
	w('어떡해', '어떠캐', ['what do i do', 'oh no', 'what to do'], 'vocab-feelings', 'Aspiration: [어떠캐].')
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
	},
	{
		id: 'vocab-time',
		label: 'Time & dates',
		standfirst: 'Days, hours, and when things happen.'
	},
	{
		id: 'vocab-verbs',
		label: 'Verbs people text',
		standfirst: 'What everyone is doing, in polite -요 form.'
	},
	{
		id: 'vocab-feelings',
		label: 'Feelings & reactions',
		standfirst: 'How a text sounds when it feels something.'
	}
];

export function wordsOfPack(pack: PackId): WordEntry[] {
	return WORDS.filter((word) => word.pack === pack);
}
