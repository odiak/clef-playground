import type { ClefModel } from "./clef";
import type { Localized } from "./i18n";

export type BingoItem = {
  id: string;
  emoji: string;
  label: Localized;
  /** Clef への質問に埋め込む、英語の名詞句（「a ... 」） */
  prompt: string;
};

export type BingoTheme = {
  id: string;
  emoji: string;
  label: Localized;
  /** 5x5 では中央の FREE を除く 24 マスに入るので、24 個以上用意する */
  items: BingoItem[];
};

function item(id: string, emoji: string, ja: string, en: string, prompt: string): BingoItem {
  return { id, emoji, label: { ja, en }, prompt };
}

// 国や地域を問わず手の届くところにありそうなものを選ぶ。
// スマホやテレビなど画面そのものは、実物かどうかの判定とぶつかるのでお題にしない
export const BINGO_THEMES: BingoTheme[] = [
  {
    id: "home",
    emoji: "🏠",
    label: { ja: "家の中", en: "Around the House" },
    items: [
      item("cup", "☕", "コップ", "Cup", "a cup, mug, or drinking glass"),
      item("spoon", "🥄", "スプーン", "Spoon", "a spoon"),
      item("plate", "🍽️", "お皿", "Plate", "a plate or dish"),
      item("bottle", "🍶", "ボトル", "Bottle", "a bottle (plastic or glass)"),
      item("key", "🔑", "鍵", "Key", "a key for a lock"),
      item("book", "📕", "本", "Book", "a book"),
      item("pillow", "🛏️", "クッション", "Cushion", "a pillow or cushion"),
      item("towel", "🧺", "タオル", "Towel", "a towel"),
      item("toothbrush", "🪥", "歯ブラシ", "Toothbrush", "a toothbrush"),
      item("remote", "📺", "リモコン", "Remote", "a remote control"),
      item("clock", "⏰", "時計", "Clock", "a clock or wristwatch"),
      item("plant", "🪴", "植物", "Plant", "a plant (potted plant, flowers, or leaves)"),
      item("shoe", "👟", "靴", "Shoe", "a shoe"),
      item("sock", "🧦", "靴下", "Sock", "a sock"),
      item("chair", "🪑", "椅子", "Chair", "a chair"),
      item("lamp", "💡", "照明", "Lamp", "a lamp or light bulb"),
      item("mirror", "🪞", "鏡", "Mirror", "a mirror"),
      item("scissors", "✂️", "はさみ", "Scissors", "a pair of scissors"),
      item("pen", "🖊️", "ペン", "Pen", "a pen"),
      item("glasses", "👓", "メガネ", "Glasses", "eyeglasses or sunglasses"),
      item("coin", "🪙", "硬貨", "Coin", "a coin"),
      item("umbrella", "☂️", "傘", "Umbrella", "an umbrella"),
      item("bag", "👜", "かばん", "Bag", "a bag, backpack, or purse"),
      item("hat", "🧢", "帽子", "Hat", "a hat or cap"),
      item("tissue", "🤧", "ティッシュ", "Tissues", "a box of tissues or tissue paper"),
      item("trash", "🗑️", "ゴミ箱", "Trash Can", "a trash can or wastebasket"),
      item("soap", "🧼", "石けん", "Soap", "a bar of soap or a bottle of soap"),
      item("hanger", "👕", "ハンガー", "Hanger", "a clothes hanger"),
      item("doorknob", "🚪", "ドアノブ", "Doorknob", "a door handle or doorknob"),
      item("outlet", "🔌", "コンセント", "Outlet", "an electrical outlet or power plug"),
    ],
  },
  {
    id: "kitchen",
    emoji: "🍳",
    label: { ja: "キッチン", en: "In the Kitchen" },
    items: [
      item("apple", "🍎", "りんご", "Apple", "an apple"),
      item("banana", "🍌", "バナナ", "Banana", "a banana"),
      item("egg", "🥚", "卵", "Egg", "an egg"),
      item("onion", "🧅", "たまねぎ", "Onion", "an onion"),
      item("carrot", "🥕", "にんじん", "Carrot", "a carrot"),
      item("tomato", "🍅", "トマト", "Tomato", "a tomato"),
      item("citrus", "🍋", "柑橘類", "Citrus", "a lemon, orange, lime, or other citrus fruit"),
      item("bread", "🍞", "パン", "Bread", "bread"),
      item("noodles", "🍝", "麺", "Noodles", "pasta or noodles (cooked or dry)"),
      item("milk", "🥛", "牛乳", "Milk", "a carton or bottle of milk"),
      item("spice", "🧂", "調味料", "Seasoning", "a container of salt, pepper, spices, or sauce"),
      item("spoon", "🥄", "スプーン", "Spoon", "a spoon"),
      item("fork", "🍴", "フォーク", "Fork", "a fork"),
      item("knife", "🔪", "包丁", "Knife", "a kitchen knife or table knife"),
      item("pan", "🍳", "鍋", "Pot", "a cooking pot or frying pan"),
      item("plate", "🍽️", "お皿", "Plate", "a plate or dish"),
      item("bowl", "🥣", "ボウル", "Bowl", "a bowl"),
      item("cup", "☕", "コップ", "Cup", "a cup, mug, or drinking glass"),
      item("kettle", "🫖", "やかん", "Kettle", "a kettle or teapot"),
      item("board", "🪵", "まな板", "Cutting Board", "a cutting board"),
      item("sponge", "🧽", "スポンジ", "Sponge", "a dish sponge or scrubber"),
      item("fridge", "🧊", "冷蔵庫", "Fridge", "a refrigerator"),
      item("microwave", "📦", "電子レンジ", "Microwave", "a microwave oven"),
      item("can", "🥫", "缶", "Can", "a drink can or food can"),
      item("jar", "🫙", "瓶", "Jar", "a glass jar"),
      item("ladle", "🥄", "お玉", "Ladle", "a ladle"),
      item("wrap", "🎞️", "ラップ", "Wrap", "a roll of plastic wrap or aluminum foil"),
      item("faucet", "🚰", "蛇口", "Faucet", "a faucet or tap"),
      item("tea", "🍵", "お茶", "Tea", "tea bags, tea leaves, or coffee (beans, grounds, or instant)"),
    ],
  },
  {
    id: "desk",
    emoji: "✏️",
    label: { ja: "デスクまわり", en: "At Your Desk" },
    items: [
      item("pen", "🖊️", "ペン", "Pen", "a pen"),
      item("pencil", "✏️", "鉛筆", "Pencil", "a pencil"),
      item("eraser", "🧽", "消しゴム", "Eraser", "an eraser (rubber)"),
      item("scissors", "✂️", "はさみ", "Scissors", "a pair of scissors"),
      item("ruler", "📏", "定規", "Ruler", "a ruler"),
      item("notebook", "📓", "ノート", "Notebook", "a notebook"),
      item("sticky", "🗒️", "ふせん", "Sticky Note", "a sticky note"),
      item("clip", "📎", "クリップ", "Paper Clip", "a paper clip or binder clip"),
      item("stapler", "📌", "ホッチキス", "Stapler", "a stapler"),
      item("tape", "🩹", "テープ", "Tape", "a roll of tape"),
      item("glue", "🧴", "のり", "Glue", "a glue stick or bottle of glue"),
      item("keyboard", "⌨️", "キーボード", "Keyboard", "a computer keyboard"),
      item("mouse", "🖱️", "マウス", "Mouse", "a computer mouse"),
      item("headphones", "🎧", "イヤホン", "Headphones", "headphones or earphones"),
      item("cable", "🔌", "ケーブル", "Cable", "a charging cable or USB cable"),
      item("calculator", "🧮", "電卓", "Calculator", "a calculator"),
      item("book", "📕", "本", "Book", "a book"),
      item("cup", "☕", "コップ", "Cup", "a cup, mug, or drinking glass"),
      item("clock", "⏰", "時計", "Clock", "a clock or wristwatch"),
      item("lamp", "💡", "照明", "Lamp", "a desk lamp or light"),
      item("envelope", "✉️", "封筒", "Envelope", "an envelope"),
      item("rubberband", "➰", "輪ゴム", "Rubber Band", "a rubber band"),
      item("highlighter", "🖍️", "蛍光ペン", "Highlighter", "a highlighter or marker pen"),
      item("folder", "📁", "ファイル", "Folder", "a document folder or binder"),
      item("calendar", "📅", "カレンダー", "Calendar", "a calendar"),
      item("glasses", "👓", "メガネ", "Glasses", "eyeglasses or sunglasses"),
      item("plant", "🪴", "植物", "Plant", "a plant (potted plant, flowers, or leaves)"),
      item("usb", "💾", "USBメモリ", "USB Stick", "a USB flash drive"),
      item("battery", "🔋", "電池", "Battery", "a battery"),
      item("card", "💳", "カード", "Card", "a plastic card (ID card, credit card, or member card) or a business card"),
    ],
  },
  {
    id: "colors",
    emoji: "🎨",
    label: { ja: "色と形", en: "Colors & Shapes" },
    items: [
      item("red", "🔴", "赤", "Red", "an object whose main color is clearly red"),
      item("blue", "🔵", "青", "Blue", "an object whose main color is clearly blue"),
      item("green", "🟢", "緑", "Green", "an object whose main color is clearly green"),
      item("yellow", "🟡", "黄色", "Yellow", "an object whose main color is clearly yellow"),
      item("orange", "🟠", "オレンジ", "Orange", "an object whose main color is clearly orange"),
      item("purple", "🟣", "紫", "Purple", "an object whose main color is clearly purple"),
      item("pink", "🌸", "ピンク", "Pink", "an object whose main color is clearly pink"),
      item("white", "⚪", "白", "White", "an object whose main color is clearly white"),
      item("black", "⚫", "黒", "Black", "an object whose main color is clearly black"),
      item("brown", "🟤", "茶色", "Brown", "an object whose main color is clearly brown"),
      item("silver", "🥈", "銀色", "Silver", "a shiny silver-colored metallic object"),
      item("gold", "🥇", "金色", "Gold", "a shiny gold-colored object"),
      item("round", "⭕", "丸", "Round", "an object that is circular or spherical"),
      item("square", "🟥", "四角", "Square", "an object with a square or rectangular shape"),
      item("triangle", "🔺", "三角", "Triangle", "an object with a triangular shape"),
      item("star", "⭐", "星形", "Star", "an object or pattern shaped like a star"),
      item("heart", "❤️", "ハート形", "Heart", "an object or pattern shaped like a heart"),
      item("stripes", "🦓", "しま模様", "Stripes", "an object with a striped pattern"),
      item("dots", "🔘", "水玉模様", "Polka Dots", "an object with a polka dot pattern"),
      item("check", "🏁", "チェック柄", "Checkered", "an object with a checkered or plaid pattern"),
      item("clear", "🫧", "透明", "Clear", "a transparent object you can see through, such as glass or clear plastic"),
      item("fluffy", "🧸", "ふわふわ", "Fluffy", "a soft, fluffy, or furry object"),
      item("wood", "🪵", "木製", "Wooden", "an object made of wood"),
      item("metal", "🔩", "金属", "Metal", "an object made of metal"),
      item("number", "🔢", "数字", "Numbers", "an object with numbers printed or written on it"),
      item("letters", "🔤", "ABC", "Letters", "an object with Latin alphabet letters printed or written on it"),
      item("long", "🥢", "細長い", "Long", "a long, thin object such as a stick or a pen"),
      item("spiky", "🌵", "トゲトゲ", "Spiky", "an object with spikes, bristles, or sharp points"),
      item("rainbow", "🌈", "カラフル", "Colorful", "a single object with three or more distinct bright colors"),
    ],
  },
  {
    id: "outside",
    emoji: "🚶",
    label: { ja: "おさんぽ", en: "Out for a Walk" },
    items: [
      item("tree", "🌳", "木", "Tree", "a tree"),
      item("flower", "🌼", "花", "Flower", "a flower"),
      item("leaf", "🍃", "葉っぱ", "Leaf", "a leaf or leaves"),
      item("grass", "🌱", "草", "Grass", "grass"),
      item("stone", "🪨", "石", "Stone", "a stone or rock"),
      item("cloud", "☁️", "雲", "Cloud", "a cloud in the sky"),
      item("car", "🚗", "車", "Car", "a car"),
      item("bicycle", "🚲", "自転車", "Bicycle", "a bicycle"),
      item("motorcycle", "🛵", "バイク", "Motorcycle", "a motorcycle or scooter"),
      item("signal", "🚦", "信号機", "Traffic Light", "a traffic light"),
      item("sign", "🚧", "道路標識", "Road Sign", "a road sign or traffic sign"),
      item("crosswalk", "🦓", "横断歩道", "Crosswalk", "a pedestrian crosswalk"),
      item("mailbox", "📮", "ポスト", "Mailbox", "a mailbox or postbox"),
      item("streetlight", "🏮", "街灯", "Streetlight", "a streetlight or lamp post"),
      item("bench", "🪑", "ベンチ", "Bench", "a bench"),
      item("fence", "🚧", "フェンス", "Fence", "a fence or railing"),
      item("door", "🚪", "ドア", "Door", "a door"),
      item("window", "🪟", "窓", "Window", "a window"),
      item("stairs", "🪜", "階段", "Stairs", "stairs or steps"),
      item("bird", "🐦", "鳥", "Bird", "a bird"),
      item("dog", "🐕", "犬", "Dog", "a dog"),
      item("cat", "🐈", "猫", "Cat", "a cat"),
      item("manhole", "🕳️", "マンホール", "Manhole", "a manhole cover"),
      item("trash", "🗑️", "ゴミ箱", "Trash Can", "a trash can or litter bin"),
      item("shopsign", "🪧", "看板", "Shop Sign", "a store sign or signboard"),
      item("wires", "⚡", "電線", "Power Lines", "overhead power lines or utility poles"),
      item("brick", "🧱", "レンガ", "Bricks", "a brick wall or brick pavement"),
      item("water", "💧", "水辺", "Water", "a puddle, pond, river, or fountain"),
      item("bus", "🚌", "バス", "Bus", "a bus, tram, or train"),
      item("flag", "🚩", "旗", "Flag", "a flag or banner"),
    ],
  },
];

export const BINGO_SIZES = [3, 5] as const;
export type BingoSize = (typeof BINGO_SIZES)[number];

/** 1 回の判定で聞くお題の最大数。5x5 の FREE を除いたマスの数 */
export const MAX_JUDGE_ITEMS = 24;

export function findTheme(id: string): BingoTheme | undefined {
  return BINGO_THEMES.find((theme) => theme.id === id);
}

export function findItem(theme: BingoTheme, id: string): BingoItem | undefined {
  return theme.items.find((item) => item.id === id);
}

export type BingoJudgeRequest = {
  /** data:image/jpeg;base64,... */
  image: string;
  model: ClefModel;
  theme: string;
  /** まだ穴が空いていないマスのお題の ID */
  items: string[];
};

export type BingoJudgeResponse = {
  model: ClefModel;
  latencyMs: number;
  /** 画面や印刷物ではなく、実物を撮った写真である確率 */
  realProbability: number;
  isReal: boolean;
  /** お題ごとの、写っている確率 */
  probabilities: Record<string, number>;
  /** 写っていると判定したお題。実物でないときは空 */
  found: string[];
};
