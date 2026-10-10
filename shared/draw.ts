import type { ClefModel } from "./clef";
import type { Localized } from "./i18n";

export type DrawTopic = {
  id: string;
  emoji: string;
  label: Localized;
  /** Clef への質問に埋め込む、英語の名詞句（「a ... 」） */
  prompt: string;
};

function topic(id: string, emoji: string, ja: string, en: string, prompt: string): DrawTopic {
  return { id, emoji, label: { ja, en }, prompt };
}

// 黒い線だけで、30 秒あれば誰でもそれらしく描けそうなものを選ぶ
export const DRAW_TOPICS: DrawTopic[] = [
  // 動物
  topic("cat", "🐱", "ねこ", "Cat", "a cat"),
  topic("dog", "🐶", "いぬ", "Dog", "a dog"),
  topic("rabbit", "🐰", "うさぎ", "Rabbit", "a rabbit"),
  topic("pig", "🐷", "ぶた", "Pig", "a pig"),
  topic("elephant", "🐘", "ぞう", "Elephant", "an elephant"),
  topic("giraffe", "🦒", "きりん", "Giraffe", "a giraffe"),
  topic("fish", "🐟", "さかな", "Fish", "a fish"),
  topic("whale", "🐳", "くじら", "Whale", "a whale"),
  topic("octopus", "🐙", "たこ", "Octopus", "an octopus"),
  topic("bird", "🐦", "とり", "Bird", "a bird"),
  topic("penguin", "🐧", "ペンギン", "Penguin", "a penguin"),
  topic("snake", "🐍", "へび", "Snake", "a snake"),
  topic("turtle", "🐢", "かめ", "Turtle", "a turtle"),
  topic("frog", "🐸", "かえる", "Frog", "a frog"),
  topic("snail", "🐌", "かたつむり", "Snail", "a snail"),
  topic("butterfly", "🦋", "ちょうちょ", "Butterfly", "a butterfly"),
  topic("spider", "🕷️", "クモ", "Spider", "a spider"),
  // 食べもの
  topic("apple", "🍎", "りんご", "Apple", "an apple"),
  topic("banana", "🍌", "バナナ", "Banana", "a banana"),
  topic("cherry", "🍒", "さくらんぼ", "Cherries", "cherries"),
  topic("carrot", "🥕", "にんじん", "Carrot", "a carrot"),
  topic("mushroom", "🍄", "きのこ", "Mushroom", "a mushroom"),
  topic("ice_cream", "🍦", "ソフトクリーム", "Ice Cream", "an ice cream cone"),
  topic("cake", "🎂", "ケーキ", "Cake", "a cake"),
  topic("donut", "🍩", "ドーナツ", "Donut", "a donut"),
  topic("pizza", "🍕", "ピザ", "Pizza", "a slice of pizza"),
  topic("cup", "☕", "マグカップ", "Mug", "a mug or cup"),
  // 自然
  topic("sun", "☀️", "たいよう", "Sun", "the sun"),
  topic("moon", "🌙", "三日月", "Crescent Moon", "a crescent moon"),
  topic("star", "⭐", "ほし", "Star", "a star"),
  topic("cloud", "☁️", "くも", "Cloud", "a cloud"),
  topic("rainbow", "🌈", "にじ", "Rainbow", "a rainbow"),
  topic("lightning", "⚡", "かみなり", "Lightning", "a lightning bolt"),
  topic("flower", "🌷", "はな", "Flower", "a flower"),
  topic("tree", "🌳", "木", "Tree", "a tree"),
  topic("leaf", "🍃", "はっぱ", "Leaf", "a leaf"),
  topic("mountain", "⛰️", "やま", "Mountain", "a mountain"),
  topic("snowman", "⛄", "ゆきだるま", "Snowman", "a snowman"),
  // 乗りもの・建物
  topic("car", "🚗", "くるま", "Car", "a car"),
  topic("bicycle", "🚲", "じてんしゃ", "Bicycle", "a bicycle"),
  topic("train", "🚃", "でんしゃ", "Train", "a train"),
  topic("airplane", "✈️", "ひこうき", "Airplane", "an airplane"),
  topic("boat", "⛵", "ふね", "Boat", "a boat"),
  topic("rocket", "🚀", "ロケット", "Rocket", "a rocket"),
  topic("house", "🏠", "いえ", "House", "a house"),
  topic("castle", "🏰", "おしろ", "Castle", "a castle"),
  // 身の回りのもの
  topic("umbrella", "☂️", "かさ", "Umbrella", "an umbrella"),
  topic("glasses", "👓", "めがね", "Glasses", "a pair of glasses"),
  topic("key", "🔑", "かぎ", "Key", "a key"),
  topic("scissors", "✂️", "はさみ", "Scissors", "a pair of scissors"),
  topic("light_bulb", "💡", "でんきゅう", "Light Bulb", "a light bulb"),
  topic("clock", "🕒", "とけい", "Clock", "a clock"),
  topic("book", "📖", "ほん", "Book", "a book"),
  topic("envelope", "✉️", "ふうとう", "Envelope", "an envelope"),
  topic("chair", "🪑", "いす", "Chair", "a chair"),
  topic("candle", "🕯️", "ろうそく", "Candle", "a candle"),
  topic("guitar", "🎸", "ギター", "Guitar", "a guitar"),
  topic("crown", "👑", "おうかん", "Crown", "a crown"),
  topic("hat", "🎩", "ぼうし", "Hat", "a hat"),
  topic("shoe", "👟", "くつ", "Shoe", "a shoe"),
  topic("t_shirt", "👕", "Tシャツ", "T-shirt", "a T-shirt"),
  topic("balloon", "🎈", "ふうせん", "Balloon", "a balloon"),
  topic("ghost", "👻", "おばけ", "Ghost", "a ghost"),
  topic("robot", "🤖", "ロボット", "Robot", "a robot"),
];

export function findTopic(id: string): DrawTopic | undefined {
  return DRAW_TOPICS.find((topic) => topic.id === id);
}

/** 時間制限（秒）。null は制限なし */
export const TIME_LIMITS = [30, null] as const;
export type TimeLimit = (typeof TIME_LIMITS)[number];

export type DrawJudgeRequest = {
  /** data:image/png;base64,... */
  image: string;
  model: ClefModel;
  topic: string;
};

export type DrawJudgeResponse = {
  model: ClefModel;
  latencyMs: number;
  /** お題の絵に見える確率 */
  probability: number;
  /** 合格になる確率の閾値 */
  threshold: number;
  passed: boolean;
  /**
   * お題とほかのいくつかのお題、「どれでもない」から、何の絵に見えるかを選ばせた結果。
   * キーはお題の ID か "other"
   */
  guesses: Record<string, number>;
};
