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
  /** 5x5 では中央の FREE を除く 24 マスをこの中から選ぶ */
  items: BingoItem[];
};

/** 表示名の長い単語は、マスに収まるよう \u200b（ゼロ幅スペース）で折り返す位置を示しておく */
function item(id: string, emoji: string, ja: string, en: string, prompt: string): BingoItem {
  return { id, emoji, label: { ja, en }, prompt };
}

// 国や地域を問わず手の届くところにありそうな、具体的な「もの」を選ぶ。
// 何度遊んでも同じカードに感じないよう、テーマごとに 60 個以上用意する。
// スマホやテレビなど画面そのものは、実物かどうかの判定とぶつかるのでお題にしない
export const BINGO_THEMES: BingoTheme[] = [
  {
    id: "home",
    emoji: "🏠",
    label: { ja: "家の中", en: "Around the House" },
    items: [
      // 家具・部屋
      item("bed", "🛏️", "ベッド", "Bed", "a bed"),
      item("sofa", "🛋️", "ソファ", "Sofa", "a sofa or couch"),
      item("chair", "🪑", "椅子", "Chair", "a chair"),
      item("table", "🪵", "テーブル", "Table", "a table"),
      item("shelf", "📚", "棚", "Shelf", "a shelf or bookcase"),
      item("drawer", "🗄️", "引き出し", "Drawer", "a drawer"),
      item("door", "🚪", "ドア", "Door", "a door"),
      item("doorknob", "🚪", "ドアノブ", "Doorknob", "a door handle or doorknob"),
      item("window", "🪟", "窓", "Window", "a window"),
      item("curtain", "🪟", "カーテン", "Curtain", "a curtain or window blind"),
      item("rug", "🟫", "マット", "Rug", "a rug, carpet, or mat"),
      item("mirror", "🪞", "鏡", "Mirror", "a mirror"),
      item("lamp", "💡", "照明", "Lamp", "a lamp or light bulb"),
      item("switch", "🔘", "スイッチ", "Light Switch", "a light switch on a wall"),
      item("outlet", "🔌", "コンセント", "Outlet", "an electrical outlet or power plug"),
      item("clock", "⏰", "時計", "Clock", "a clock"),
      item("plant", "🪴", "植物", "Plant", "a plant (potted plant, flowers, or leaves)"),
      item("vase", "🏺", "花瓶", "Vase", "a vase"),
      item("candle", "🕯️", "ろうそく", "Candle", "a candle"),
      item("fan", "🌀", "扇風機", "Fan", "an electric fan"),
      item("remote", "📺", "リモコン", "Remote", "a remote control"),
      item("trash", "🗑️", "ゴミ箱", "Trash Can", "a trash can or wastebasket"),
      item("box", "📦", "箱", "Box", "a cardboard box or other box"),
      item("basket", "🧺", "かご", "Basket", "a basket"),
      // 寝具・衣類・身につけるもの
      item("pillow", "🛏️", "枕", "Pillow", "a pillow"),
      item("cushion", "🛋️", "クッション", "Cushion", "a cushion"),
      item("blanket", "🛌", "毛布", "Blanket", "a blanket or duvet"),
      item("tshirt", "👕", "Tシャツ", "T-shirt", "a T-shirt"),
      item("jacket", "🧥", "上着", "Jacket", "a jacket or coat"),
      item("pants", "👖", "ズボン", "Pants", "trousers, jeans, or shorts"),
      item("sock", "🧦", "靴下", "Sock", "a sock"),
      item("shoe", "👟", "靴", "Shoe", "a shoe"),
      item("slipper", "🩴", "スリッパ", "Slippers", "slippers or sandals"),
      item("hat", "🧢", "帽子", "Hat", "a hat or cap"),
      item("hanger", "👔", "ハンガー", "Hanger", "a clothes hanger"),
      item("glasses", "👓", "メガネ", "Glasses", "eyeglasses or sunglasses"),
      item("watch", "⌚", "腕時計", "Watch", "a wristwatch"),
      item("jewelry", "💍", "アクセサリー", "Jewelry", "a ring, necklace, earrings, or bracelet"),
      item("hairtie", "🎀", "ヘアゴム", "Hair Tie", "a hair tie, hair clip, or headband"),
      item("bag", "👜", "かばん", "Bag", "a handbag, tote bag, or shoulder bag"),
      item("backpack", "🎒", "リュック", "Backpack", "a backpack"),
      item("wallet", "👛", "財布", "Wallet", "a wallet or purse"),
      item("umbrella", "☂️", "傘", "Umbrella", "an umbrella"),
      item("key", "🔑", "鍵", "Key", "a key for a lock"),
      item("coin", "🪙", "硬貨", "Coin", "a coin"),
      // 洗面所・お風呂
      item("toothbrush", "🪥", "歯ブラシ", "Toothbrush", "a toothbrush"),
      item("toothpaste", "🦷", "歯みがき粉", "Toothpaste", "a tube of toothpaste"),
      item("comb", "💇", "くし", "Comb", "a comb or hairbrush"),
      item("soap", "🧼", "石けん", "Soap", "a bar of soap or a bottle of hand soap"),
      item("shampoo", "🧴", "シャンプー", "Shampoo", "a bottle of shampoo, conditioner, or body wash"),
      item("towel", "🧺", "タオル", "Towel", "a towel"),
      item("toiletpaper", "🧻", "トイレット\u200bペーパー", "Toilet Paper", "a roll of toilet paper"),
      item("tissue", "🤧", "ティッシュ", "Tissues", "a box of tissues or tissue paper"),
      item("hairdryer", "💨", "ドライヤー", "Hair Dryer", "a hair dryer"),
      item("nailclipper", "💅", "爪切り", "Nail Clipper", "nail clippers"),
      item("bucket", "🪣", "バケツ", "Bucket", "a bucket"),
      item("washer", "🫧", "洗濯機", "Washer", "a washing machine"),
      item("cleaner", "🧹", "掃除道具", "Cleaning Tool", "a broom, mop, or vacuum cleaner"),
      item("medicine", "💊", "薬", "Medicine", "medicine (pills, tablets, or a medicine bottle or box)"),
      item("bandage", "🩹", "絆創膏", "Bandage", "an adhesive bandage"),
      // そのほか
      item("cup", "☕", "コップ", "Cup", "a cup, mug, or drinking glass"),
      item("plate", "🍽️", "お皿", "Plate", "a plate or dish"),
      item("spoon", "🥄", "スプーン", "Spoon", "a spoon"),
      item("bottle", "🍶", "ボトル", "Bottle", "a bottle (plastic or glass)"),
      item("book", "📕", "本", "Book", "a book"),
      item("pen", "🖊️", "ペン", "Pen", "a pen"),
      item("scissors", "✂️", "はさみ", "Scissors", "a pair of scissors"),
      item("battery", "🔋", "電池", "Battery", "a battery"),
      item("cable", "🔌", "ケーブル", "Cable", "a charging cable or USB cable"),
      item("headphones", "🎧", "イヤホン", "Headphones", "headphones or earphones"),
      item("toy", "🧸", "ぬいぐるみ", "Stuffed Toy", "a stuffed animal or plush toy"),
      item("ball", "⚽", "ボール", "Ball", "a ball"),
      item("plasticbag", "🛍️", "袋", "Bag (Plastic)", "a plastic bag, paper bag, or shopping bag"),
    ],
  },
  {
    id: "kitchen",
    emoji: "🍳",
    label: { ja: "キッチン・食べもの", en: "Kitchen & Food" },
    items: [
      // 果物
      item("apple", "🍎", "りんご", "Apple", "an apple"),
      item("banana", "🍌", "バナナ", "Banana", "a banana"),
      item("orange", "🍊", "オレンジ", "Orange", "an orange, mandarin, or tangerine"),
      item("lemon", "🍋", "レモン", "Lemon", "a lemon or lime"),
      item("grape", "🍇", "ぶどう", "Grapes", "grapes"),
      item("strawberry", "🍓", "いちご", "Strawberry", "a strawberry"),
      item("kiwi", "🥝", "キウイ", "Kiwi", "a kiwi fruit"),
      item("avocado", "🥑", "アボカド", "Avocado", "an avocado"),
      // 野菜
      item("onion", "🧅", "たまねぎ", "Onion", "an onion"),
      item("carrot", "🥕", "にんじん", "Carrot", "a carrot"),
      item("tomato", "🍅", "トマト", "Tomato", "a tomato"),
      item("potato", "🥔", "じゃがいも", "Potato", "a potato"),
      item("cucumber", "🥒", "きゅうり", "Cucumber", "a cucumber"),
      item("lettuce", "🥬", "葉もの野菜", "Leafy Greens", "lettuce, cabbage, or other leafy greens"),
      item("garlic", "🧄", "にんにく", "Garlic", "garlic"),
      item("pepper", "🫑", "ピーマン", "Bell Pepper", "a bell pepper"),
      item("mushroom", "🍄", "きのこ", "Mushroom", "mushrooms"),
      item("corn", "🌽", "とうもろこし", "Corn", "corn"),
      item("eggplant", "🍆", "なす", "Eggplant", "an eggplant"),
      item("broccoli", "🥦", "ブロッコリー", "Broccoli", "broccoli"),
      // 食べもの・飲みもの
      item("egg", "🥚", "卵", "Egg", "an egg"),
      item("bread", "🍞", "パン", "Bread", "bread"),
      item("rice", "🍚", "お米", "Rice", "rice (cooked or uncooked)"),
      item("noodles", "🍝", "麺", "Noodles", "pasta or noodles (cooked or dry)"),
      item("milk", "🥛", "牛乳", "Milk", "a carton or bottle of milk"),
      item("cheese", "🧀", "チーズ", "Cheese", "cheese"),
      item("butter", "🧈", "バター", "Butter", "butter"),
      item("meat", "🥩", "お肉", "Meat", "raw or cooked meat"),
      item("fish", "🐟", "魚", "Fish", "fish (raw, cooked, or canned)"),
      item("nuts", "🥜", "ナッツ", "Nuts", "nuts such as peanuts, almonds, or walnuts"),
      item("snack", "🍪", "お菓子", "Snack", "cookies, crackers, chips, or other snacks"),
      item("chocolate", "🍫", "チョコ", "Chocolate", "chocolate"),
      item("candy", "🍬", "キャンディ", "Candy", "candy or gummies"),
      item("jam", "🍯", "ジャム", "Jam or Honey", "a jar of jam or honey"),
      item("sauce", "🥫", "ソース類", "Sauce", "a bottle of ketchup, mayonnaise, soy sauce, or other sauce"),
      item("salt", "🧂", "塩こしょう", "Salt & Pepper", "salt or pepper (in a shaker or container)"),
      item("oil", "🫒", "油", "Oil", "a bottle of cooking oil"),
      item("tea", "🍵", "お茶", "Tea", "tea bags, tea leaves, or a cup of tea"),
      item("coffee", "☕", "コーヒー", "Coffee", "coffee (beans, grounds, instant, or a cup of coffee)"),
      item("juice", "🧃", "ジュース", "Juice", "a juice box or bottle of juice"),
      item("ice", "🧊", "氷", "Ice", "ice cubes"),
      // 道具
      item("spoon", "🥄", "スプーン", "Spoon", "a spoon"),
      item("fork", "🍴", "フォーク", "Fork", "a fork"),
      item("knife", "🔪", "包丁", "Knife", "a kitchen knife or table knife"),
      item("chopsticks", "🥢", "箸", "Chopsticks", "chopsticks"),
      item("fryingpan", "🍳", "フライパン", "Frying Pan", "a frying pan"),
      item("pot", "🍲", "鍋", "Pot", "a cooking pot or saucepan"),
      item("plate", "🍽️", "お皿", "Plate", "a plate or dish"),
      item("bowl", "🥣", "ボウル", "Bowl", "a bowl"),
      item("cup", "☕", "マグカップ", "Mug", "a cup or mug"),
      item("glass", "🥛", "グラス", "Glass", "a drinking glass"),
      item("kettle", "🫖", "やかん", "Kettle", "a kettle or teapot"),
      item("board", "🪵", "まな板", "Cutting Board", "a cutting board"),
      item("ladle", "🥄", "お玉", "Ladle", "a ladle"),
      item("spatula", "🍳", "ヘラ", "Spatula", "a spatula or turner"),
      item("whisk", "🥄", "泡立て器", "Whisk", "a whisk"),
      item("tongs", "🥢", "トング", "Tongs", "kitchen tongs"),
      item("strainer", "🥣", "ザル", "Strainer", "a colander or strainer"),
      item("tray", "🍽️", "お盆", "Tray", "a tray"),
      item("container", "🍱", "保存容器", "Container", "a food storage container or lunch box"),
      item("wrap", "🎞️", "ラップ", "Wrap", "a roll of plastic wrap or aluminum foil"),
      item("napkin", "🧻", "紙ナプキン", "Napkin", "paper towels or paper napkins"),
      item("sponge", "🧽", "スポンジ", "Sponge", "a dish sponge or scrubber"),
      item("detergent", "🧴", "洗剤", "Dish Soap", "a bottle of dish soap or detergent"),
      // 設備・入れもの
      item("fridge", "🧊", "冷蔵庫", "Fridge", "a refrigerator"),
      item("microwave", "📦", "電子レンジ", "Microwave", "a microwave oven"),
      item("toaster", "🍞", "トースター", "Toaster", "a toaster or toaster oven"),
      item("stove", "🔥", "コンロ", "Stove", "a stove or cooktop"),
      item("faucet", "🚰", "蛇口", "Faucet", "a faucet or tap"),
      item("sink", "🚰", "流し", "Sink", "a kitchen sink"),
      item("trash", "🗑️", "ゴミ箱", "Trash Can", "a trash can"),
      item("can", "🥫", "缶", "Can", "a drink can or food can"),
      item("jar", "🫙", "瓶", "Jar", "a glass jar"),
      item("bottle", "🍶", "ペットボトル", "Plastic Bottle", "a plastic bottle"),
    ],
  },
  {
    id: "desk",
    emoji: "✏️",
    label: { ja: "デスクまわり", en: "At Your Desk" },
    items: [
      // 文房具
      item("pen", "🖊️", "ペン", "Pen", "a pen"),
      item("pencil", "✏️", "鉛筆", "Pencil", "a pencil"),
      item("coloredpencil", "🖍️", "色鉛筆", "Colored Pencils", "colored pencils or crayons"),
      item("highlighter", "🖍️", "マーカー", "Marker", "a highlighter or marker pen"),
      item("eraser", "🧽", "消しゴム", "Eraser", "an eraser (rubber)"),
      item("correction", "🩹", "修正テープ", "Correction Tape", "correction tape or correction fluid"),
      item("sharpener", "✏️", "鉛筆削り", "Sharpener", "a pencil sharpener"),
      item("pencilcase", "👝", "ペンケース", "Pencil Case", "a pencil case"),
      item("penholder", "🥫", "ペン立て", "Pen Holder", "a pen holder or pencil cup"),
      item("ruler", "📏", "定規", "Ruler", "a ruler"),
      item("scissors", "✂️", "はさみ", "Scissors", "a pair of scissors"),
      item("cutter", "🔪", "カッター", "Box Cutter", "a utility knife or box cutter"),
      item("stapler", "📌", "ホッチキス", "Stapler", "a stapler"),
      item("holepunch", "🕳️", "パンチ", "Hole Punch", "a hole punch"),
      item("clip", "📎", "クリップ", "Paper Clip", "a paper clip or binder clip"),
      item("thumbtack", "📌", "画びょう", "Thumbtack", "a thumbtack or push pin"),
      item("rubberband", "➰", "輪ゴム", "Rubber Band", "a rubber band"),
      item("tape", "🩹", "テープ", "Tape", "a roll of tape"),
      item("glue", "🧴", "のり", "Glue", "a glue stick or bottle of glue"),
      item("sticky", "🗒️", "ふせん", "Sticky Note", "a sticky note"),
      item("sticker", "⭐", "シール", "Sticker", "stickers"),
      item("stamp", "🔖", "はんこ", "Stamp", "a rubber stamp or ink stamp"),
      item("notebook", "📓", "ノート", "Notebook", "a notebook"),
      item("paper", "📄", "紙", "Paper", "a sheet of paper"),
      item("envelope", "✉️", "封筒", "Envelope", "an envelope"),
      item("folder", "📁", "ファイル", "Folder", "a document folder or binder"),
      item("book", "📕", "本", "Book", "a book"),
      item("bookmark", "🔖", "しおり", "Bookmark", "a bookmark"),
      item("calendar", "📅", "カレンダー", "Calendar", "a calendar"),
      item("calculator", "🧮", "電卓", "Calculator", "a calculator"),
      item("whiteboard", "⬜", "ホワイト\u200bボード", "Whiteboard", "a whiteboard"),
      item("tapemeasure", "📏", "メジャー", "Tape Measure", "a tape measure"),
      // 機器
      item("keyboard", "⌨️", "キーボード", "Keyboard", "a computer keyboard"),
      item("mouse", "🖱️", "マウス", "Mouse", "a computer mouse"),
      item("mousepad", "🟦", "マウスパッド", "Mouse Pad", "a mouse pad"),
      item("headphones", "🎧", "イヤホン", "Headphones", "headphones or earphones"),
      item("speaker", "🔊", "スピーカー", "Speaker", "a speaker"),
      item("microphone", "🎤", "マイク", "Microphone", "a microphone"),
      item("controller", "🎮", "コントローラー", "Controller", "a game controller"),
      item("printer", "🖨️", "プリンター", "Printer", "a printer"),
      item("cable", "🔌", "ケーブル", "Cable", "a charging cable or USB cable"),
      item("charger", "🔌", "充電器", "Charger", "a charger or power adapter"),
      item("powerstrip", "🔌", "電源タップ", "Power Strip", "a power strip"),
      item("usb", "💾", "USBメモリ", "USB Stick", "a USB flash drive"),
      item("battery", "🔋", "電池", "Battery", "a battery"),
      item("lamp", "💡", "ライト", "Desk Lamp", "a desk lamp or light"),
      // 机の上のそのほか
      item("desk", "🪑", "机", "Desk", "a desk"),
      item("chair", "🪑", "椅子", "Chair", "a chair"),
      item("cup", "☕", "コップ", "Cup", "a cup, mug, or drinking glass"),
      item("coaster", "🟤", "コースター", "Coaster", "a coaster"),
      item("bottle", "🍶", "ボトル", "Bottle", "a bottle (plastic or glass)"),
      item("snack", "🍪", "お菓子", "Snack", "cookies, candy, chips, or other snacks"),
      item("clock", "⏰", "時計", "Clock", "a clock"),
      item("watch", "⌚", "腕時計", "Watch", "a wristwatch"),
      item("glasses", "👓", "メガネ", "Glasses", "eyeglasses or sunglasses"),
      item("plant", "🪴", "植物", "Plant", "a plant (potted plant, flowers, or leaves)"),
      item("tissue", "🤧", "ティッシュ", "Tissues", "a box of tissues or tissue paper"),
      item("trash", "🗑️", "ゴミ箱", "Trash Can", "a trash can or wastebasket"),
      item("box", "📦", "箱", "Box", "a cardboard box or other box"),
      item("key", "🔑", "鍵", "Key", "a key for a lock"),
      item("card", "💳", "カード", "Card", "a plastic card (ID card, credit card, or member card) or a business card"),
      item("backpack", "🎒", "リュック", "Backpack", "a backpack"),
      item("screwdriver", "🪛", "ドライバー", "Screwdriver", "a screwdriver"),
    ],
  },
  {
    id: "outside",
    emoji: "🚶",
    label: { ja: "おでかけ", en: "Out & About" },
    items: [
      // 自然・生きもの
      item("tree", "🌳", "木", "Tree", "a tree"),
      item("flower", "🌼", "花", "Flower", "a flower"),
      item("leaf", "🍃", "葉っぱ", "Leaf", "a leaf or leaves"),
      item("grass", "🌱", "草", "Grass", "grass"),
      item("hedge", "🌳", "植え込み", "Bush", "a hedge or bush"),
      item("branch", "🌿", "枝", "Branch", "a tree branch or stick"),
      item("nut", "🌰", "木の実", "Nut or Berry", "a nut, acorn, pine cone, or berry from a plant"),
      item("moss", "🌱", "こけ", "Moss", "moss"),
      item("stone", "🪨", "石", "Stone", "a stone or rock"),
      item("sand", "🏖️", "砂", "Sand", "sand"),
      item("soil", "🟫", "土", "Soil", "bare soil or dirt"),
      item("water", "💧", "水辺", "Water", "a puddle, pond, river, or fountain"),
      item("cloud", "☁️", "雲", "Cloud", "a cloud in the sky"),
      item("shadow", "👤", "影", "Shadow", "a shadow on the ground"),
      item("bird", "🐦", "鳥", "Bird", "a bird"),
      item("insect", "🐜", "虫", "Bug", "an insect or bug"),
      item("dog", "🐕", "犬", "Dog", "a dog"),
      item("cat", "🐈", "猫", "Cat", "a cat"),
      item("feather", "🪶", "羽根", "Feather", "a feather"),
      item("flowerpot", "🪴", "植木鉢", "Planter", "a flower pot or planter"),
      // 乗りもの
      item("car", "🚗", "車", "Car", "a car"),
      item("truck", "🚚", "トラック", "Truck", "a truck"),
      item("bus", "🚌", "バス", "Bus", "a bus"),
      item("train", "🚃", "電車", "Train", "a train or tram"),
      item("bicycle", "🚲", "自転車", "Bicycle", "a bicycle"),
      item("motorcycle", "🛵", "バイク", "Motorcycle", "a motorcycle or scooter"),
      item("tire", "🛞", "タイヤ", "Tire", "a tire or wheel"),
      item("plate", "🔢", "ナンバー\u200bプレート", "License Plate", "a vehicle license plate"),
      item("cart", "🛒", "カート", "Cart", "a shopping cart or trolley"),
      // 道路
      item("signal", "🚦", "信号機", "Traffic Light", "a traffic light"),
      item("sign", "⚠️", "道路標識", "Road Sign", "a road sign or traffic sign"),
      item("crosswalk", "🦓", "横断歩道", "Crosswalk", "a pedestrian crosswalk"),
      item("roadline", "➖", "白線", "Road Lines", "lines painted on the road"),
      item("arrow", "⬆️", "矢印", "Arrow", "an arrow painted on the road or on a sign"),
      item("sidewalk", "🚶", "歩道", "Sidewalk", "a sidewalk or footpath"),
      item("cone", "🚧", "カラーコーン", "Traffic Cone", "a traffic cone"),
      item("guardrail", "🚧", "ガードレール", "Guardrail", "a guardrail or barrier along a road"),
      item("streetlight", "🏮", "街灯", "Streetlight", "a streetlight or lamp post"),
      item("wires", "⚡", "電線", "Power Lines", "overhead power lines or utility poles"),
      item("manhole", "🕳️", "マンホール", "Manhole", "a manhole cover"),
      item("drain", "🌧️", "排水溝", "Drain", "a drain grate or gutter"),
      item("hydrant", "🧯", "消火栓", "Hydrant", "a fire hydrant"),
      item("busstop", "🚏", "バス停", "Bus Stop", "a bus stop"),
      item("parking", "🅿️", "駐車場", "Parking", "a parking lot or parking sign"),
      item("bridge", "🌉", "橋", "Bridge", "a bridge"),
      // 建物・まち
      item("building", "🏢", "ビル", "Building", "a tall building"),
      item("house", "🏠", "家", "House", "a house"),
      item("roof", "🏠", "屋根", "Roof", "a roof"),
      item("door", "🚪", "ドア", "Door", "a door"),
      item("window", "🪟", "窓", "Window", "a window"),
      item("gate", "⛩️", "門", "Gate", "a gate"),
      item("fence", "🚧", "フェンス", "Fence", "a fence or railing"),
      item("brick", "🧱", "レンガ", "Bricks", "a brick wall or brick pavement"),
      item("stairs", "🪜", "階段", "Stairs", "stairs or steps"),
      item("handrail", "🪜", "手すり", "Handrail", "a handrail"),
      item("balcony", "🏢", "ベランダ", "Balcony", "a balcony"),
      item("camera", "📹", "防犯カメラ", "CCTV", "a security camera"),
      item("mailbox", "📮", "ポスト", "Mailbox", "a mailbox or postbox"),
      item("shopsign", "🪧", "看板", "Shop Sign", "a store sign or signboard"),
      item("flag", "🚩", "旗", "Flag", "a flag or banner"),
      item("clock", "🕐", "時計", "Clock", "a clock"),
      item("statue", "🗿", "像", "Statue", "a statue or monument"),
      item("bench", "🪑", "ベンチ", "Bench", "a bench"),
      item("playground", "🛝", "遊具", "Playground", "playground equipment such as a slide or swing"),
      item("trash", "🗑️", "ゴミ箱", "Trash Can", "a trash can or litter bin"),
      item("umbrella", "☂️", "傘", "Umbrella", "an umbrella"),
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
