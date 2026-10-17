import type { ClefModel } from "./clef";
import type { Localized } from "./i18n";

export type DrawTopic = {
  id: string;
  label: Localized;
  /** Clef への質問に埋め込む、英語の名詞句（「a ... 」） */
  prompt: string;
  /** 形が複雑だったり、ほかのものと描き分けにくかったりする、難しいお題 */
  hard: boolean;
};

function topic(id: string, ja: string, en: string, prompt: string): DrawTopic {
  return { id, label: { ja, en }, prompt, hard: false };
}

function hardTopic(id: string, ja: string, en: string, prompt: string): DrawTopic {
  return { id, label: { ja, en }, prompt, hard: true };
}

// 黒い線だけで、30 秒あれば誰でもそれらしく描けそうなものを選ぶ。
// 絵文字を出すとお手本になってしまうので、お題は名前だけにする。
// 表示名はふだん書くとおりの表記にし、同じ読みのものと取り違えないようにする
// （「くも」ではなく「雲」と「クモ」、「はな」ではなく「花」）。動物の名前はカタカナで書く
export const DRAW_TOPICS: DrawTopic[] = [
  // 動物
  topic("cat", "ネコ", "Cat", "a cat"),
  topic("dog", "イヌ", "Dog", "a dog"),
  topic("rabbit", "ウサギ", "Rabbit", "a rabbit"),
  topic("pig", "ブタ", "Pig", "a pig"),
  topic("elephant", "ゾウ", "Elephant", "an elephant"),
  topic("giraffe", "キリン", "Giraffe", "a giraffe"),
  topic("fish", "魚", "Fish", "a fish"),
  topic("whale", "クジラ", "Whale", "a whale"),
  topic("octopus", "タコ", "Octopus", "an octopus"),
  topic("bird", "鳥", "Bird", "a bird"),
  topic("penguin", "ペンギン", "Penguin", "a penguin"),
  topic("snake", "ヘビ", "Snake", "a snake"),
  topic("turtle", "カメ", "Turtle", "a turtle"),
  topic("frog", "カエル", "Frog", "a frog"),
  topic("snail", "カタツムリ", "Snail", "a snail"),
  topic("butterfly", "チョウ", "Butterfly", "a butterfly"),
  topic("spider", "クモ", "Spider", "a spider"),
  // 食べもの
  topic("apple", "りんご", "Apple", "an apple"),
  topic("banana", "バナナ", "Banana", "a banana"),
  topic("cherry", "さくらんぼ", "Cherries", "cherries"),
  topic("carrot", "にんじん", "Carrot", "a carrot"),
  topic("mushroom", "きのこ", "Mushroom", "a mushroom"),
  topic("ice_cream", "ソフトクリーム", "Ice Cream", "an ice cream cone"),
  topic("cake", "ケーキ", "Cake", "a cake"),
  topic("donut", "ドーナツ", "Donut", "a donut"),
  topic("pizza", "ピザ", "Pizza", "a slice of pizza"),
  topic("cup", "マグカップ", "Mug", "a mug or cup"),
  // 自然
  topic("sun", "太陽", "Sun", "the sun"),
  topic("moon", "三日月", "Crescent Moon", "a crescent moon"),
  topic("star", "星", "Star", "a star"),
  topic("cloud", "雲", "Cloud", "a cloud"),
  topic("rainbow", "虹", "Rainbow", "a rainbow"),
  topic("lightning", "雷", "Lightning", "a lightning bolt"),
  topic("flower", "花", "Flower", "a flower"),
  topic("tree", "木", "Tree", "a tree"),
  topic("leaf", "葉っぱ", "Leaf", "a leaf"),
  topic("mountain", "山", "Mountain", "a mountain"),
  topic("snowman", "雪だるま", "Snowman", "a snowman"),
  // 乗りもの・建物
  topic("car", "車", "Car", "a car"),
  topic("bicycle", "自転車", "Bicycle", "a bicycle"),
  topic("train", "電車", "Train", "a train"),
  topic("airplane", "飛行機", "Airplane", "an airplane"),
  topic("boat", "船", "Boat", "a boat"),
  topic("rocket", "ロケット", "Rocket", "a rocket"),
  topic("house", "家", "House", "a house"),
  topic("castle", "お城", "Castle", "a castle"),
  // 身の回りのもの
  topic("umbrella", "傘", "Umbrella", "an umbrella"),
  topic("glasses", "メガネ", "Glasses", "a pair of glasses"),
  topic("key", "鍵", "Key", "a key"),
  topic("scissors", "はさみ", "Scissors", "a pair of scissors"),
  topic("light_bulb", "電球", "Light Bulb", "a light bulb"),
  topic("clock", "時計", "Clock", "a clock"),
  topic("book", "本", "Book", "a book"),
  topic("envelope", "封筒", "Envelope", "an envelope"),
  topic("chair", "椅子", "Chair", "a chair"),
  topic("candle", "ろうそく", "Candle", "a candle"),
  topic("guitar", "ギター", "Guitar", "a guitar"),
  topic("crown", "王冠", "Crown", "a crown"),
  topic("hat", "帽子", "Hat", "a hat"),
  topic("shoe", "靴", "Shoe", "a shoe"),
  topic("t_shirt", "Tシャツ", "T-shirt", "a T-shirt"),
  topic("balloon", "風船", "Balloon", "a balloon"),
  topic("ghost", "おばけ", "Ghost", "a ghost"),
  topic("robot", "ロボット", "Robot", "a robot"),

  // 難しいお題: 形が込み入っていたり、特徴をつかまないとほかの動物やものに見えたりするもの。
  // 色に頼らないと伝わらないものや、形のないもの（風など）は、どう描いても無理なので入れない
  hardTopic("kangaroo", "カンガルー", "Kangaroo", "a kangaroo"),
  hardTopic("hedgehog", "ハリネズミ", "Hedgehog", "a hedgehog"),
  hardTopic("flamingo", "フラミンゴ", "Flamingo", "a flamingo"),
  hardTopic("seahorse", "タツノオトシゴ", "Seahorse", "a seahorse"),
  hardTopic("camel", "ラクダ", "Camel", "a camel"),
  hardTopic("zebra", "シマウマ", "Zebra", "a zebra"),
  hardTopic("lion", "ライオン", "Lion", "a lion"),
  hardTopic("crab", "カニ", "Crab", "a crab"),
  hardTopic("dinosaur", "恐竜", "Dinosaur", "a dinosaur"),
  hardTopic("helicopter", "ヘリコプター", "Helicopter", "a helicopter"),
  hardTopic("fire_truck", "消防車", "Fire Truck", "a fire truck"),
  hardTopic("ferris_wheel", "観覧車", "Ferris Wheel", "a Ferris wheel"),
  hardTopic("lighthouse", "灯台", "Lighthouse", "a lighthouse"),
  hardTopic("piano", "ピアノ", "Piano", "a piano"),
  hardTopic("violin", "バイオリン", "Violin", "a violin"),
  hardTopic("camera", "カメラ", "Camera", "a camera"),
  hardTopic("vacuum", "掃除機", "Vacuum Cleaner", "a vacuum cleaner"),
  hardTopic("hamburger", "ハンバーガー", "Hamburger", "a hamburger"),
  hardTopic("spaghetti", "スパゲッティ", "Spaghetti", "a plate of spaghetti"),
  hardTopic("volcano", "火山", "Volcano", "a volcano"),
  hardTopic("waterfall", "滝", "Waterfall", "a waterfall"),
  hardTopic("tornado", "竜巻", "Tornado", "a tornado"),
  hardTopic("tent", "テント", "Tent", "a tent"),
  hardTopic("astronaut", "宇宙飛行士", "Astronaut", "an astronaut"),
];

/** お題のうち、難しいお題が出る割合 */
export const HARD_TOPIC_RATE = 0.25;

export function findTopic(id: string): DrawTopic | undefined {
  return DRAW_TOPICS.find((topic) => topic.id === id);
}

/** 何の絵に見えるかの答えのうち、一番確率が高い選択肢（お題の ID か "other"） */
export function topGuess(guesses: Record<string, number>): string {
  return Object.entries(guesses).reduce((best, entry) => (entry[1] > best[1] ? entry : best), ["", -1])[0];
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
