import type { ClefModel } from "./clef";
import type { Localized } from "./i18n";

type ChoiceDefinition = {
  type: "choice";
  /** 画面に表示する質問 */
  label: Localized;
  /** Clef に渡す質問 */
  instructions: string;
  options: Record<string, { label: Localized; description: string }>;
};

type NoulDefinition = {
  type: "noul";
  label: Localized;
  instructions: string;
};

/** アバターを作るために Clef に聞く質問 */
export const AVATAR_QUESTIONS = {
  face_shape: {
    type: "choice",
    label: { ja: "顔の形は？", en: "Face shape?" },
    instructions: "What is the overall shape of the person's face?",
    options: {
      round: { label: { ja: "丸顔", en: "Round" }, description: "Round face with full cheeks; about as wide as it is long" },
      oval: { label: { ja: "卵型", en: "Oval" }, description: "Oval face, slightly longer than wide, with a gently tapered chin" },
      square: { label: { ja: "四角", en: "Square" }, description: "Square face with a wide, strong jawline" },
      long: { label: { ja: "面長", en: "Long" }, description: "Long, narrow face" },
    },
  },
  skin_tone: {
    type: "choice",
    label: { ja: "肌の色は？", en: "Skin tone?" },
    instructions: "What is the person's skin tone?",
    options: {
      light: { label: { ja: "明るめ", en: "Light" }, description: "Light or fair skin" },
      medium: { label: { ja: "ふつう", en: "Medium" }, description: "Medium skin" },
      tan: { label: { ja: "小麦色", en: "Tan" }, description: "Tan or olive skin" },
      deep: { label: { ja: "濃いめ", en: "Deep" }, description: "Deep brown or dark skin" },
    },
  },
  hair_length: {
    type: "choice",
    label: { ja: "髪の長さは？", en: "Hair length?" },
    instructions: "How long is the person's hair?",
    options: {
      bald: { label: { ja: "なし", en: "Bald" }, description: "Bald or almost no hair" },
      buzz: { label: { ja: "ベリーショート", en: "Buzz cut" }, description: "Very short buzz cut or crew cut" },
      short: { label: { ja: "ショート", en: "Short" }, description: "Short hair that ends above the ears or at the nape" },
      medium: { label: { ja: "ミディアム", en: "Medium" }, description: "Medium-length hair reaching the chin or the neck" },
      long: { label: { ja: "ロング", en: "Long" }, description: "Long hair reaching the shoulders or below" },
    },
  },
  hair_color: {
    type: "choice",
    label: { ja: "髪の色は？", en: "Hair color?" },
    instructions: "What color is the person's hair?",
    options: {
      black: { label: { ja: "黒", en: "Black" }, description: "Black hair" },
      dark_brown: { label: { ja: "こげ茶", en: "Dark brown" }, description: "Dark brown hair" },
      brown: { label: { ja: "茶色", en: "Brown" }, description: "Light or medium brown hair" },
      blonde: { label: { ja: "金髪", en: "Blonde" }, description: "Blonde or golden hair" },
      gray: { label: { ja: "グレー", en: "Gray" }, description: "Gray, silver, or white hair" },
      red: { label: { ja: "赤", en: "Red" }, description: "Red, auburn, or orange hair" },
      colorful: { label: { ja: "カラフル", en: "Colorful" }, description: "Dyed in a vivid color such as pink, blue, green, or purple" },
    },
  },
  hair_texture: {
    type: "choice",
    label: { ja: "髪質は？", en: "Hair texture?" },
    instructions: "What is the texture of the person's hair?",
    options: {
      straight: { label: { ja: "ストレート", en: "Straight" }, description: "Straight hair" },
      wavy: { label: { ja: "ウェーブ", en: "Wavy" }, description: "Wavy hair" },
      curly: { label: { ja: "くせ毛・カール", en: "Curly" }, description: "Curly or coily hair" },
    },
  },
  hair_volume: {
    type: "choice",
    label: { ja: "髪のボリュームは？", en: "Hair volume?" },
    instructions: "How much volume does the person's hair have?",
    options: {
      flat: { label: { ja: "ぺたんこ", en: "Flat" }, description: "Flat, sleek hair lying close to the head" },
      normal: { label: { ja: "ふつう", en: "Normal" }, description: "Average volume" },
      full: { label: { ja: "ふんわり", en: "Full" }, description: "Voluminous, puffy hair" },
    },
  },
  bangs: {
    type: "choice",
    label: { ja: "前髪は？", en: "Bangs?" },
    instructions: "How are the person's bangs (fringe) styled?",
    options: {
      none: { label: { ja: "おでこを出す", en: "No bangs" }, description: "No bangs; the forehead is visible" },
      full: { label: { ja: "下ろしている", en: "Full" }, description: "Straight bangs covering the forehead" },
      side: { label: { ja: "横に流す", en: "Side-swept" }, description: "Side-swept bangs partly covering the forehead" },
    },
  },
  hair_parting: {
    type: "choice",
    label: { ja: "分け目は？", en: "Hair part?" },
    instructions: "Where is the person's hair parted, as seen in the image?",
    options: {
      center: { label: { ja: "真ん中", en: "Center" }, description: "Parted in the center" },
      left: { label: { ja: "左寄り", en: "Left" }, description: "Parted toward the left side of the image" },
      right: { label: { ja: "右寄り", en: "Right" }, description: "Parted toward the right side of the image" },
      none: { label: { ja: "なし", en: "None" }, description: "No visible parting" },
    },
  },
  hair_styled_up: {
    type: "noul",
    label: { ja: "髪を立てている？", en: "Hair styled up?" },
    instructions: "Is the person's hair styled upward or spiky, for example with gel or wax?",
  },
  hair_updo: {
    type: "choice",
    label: { ja: "髪のまとめ方は？", en: "Hair tied up?" },
    instructions: "Is the person's hair tied or put up? If so, how?",
    options: {
      none: { label: { ja: "下ろしている", en: "Down" }, description: "Hair is down and loose, or too short to tie" },
      bun: { label: { ja: "お団子", en: "Bun" }, description: "A bun on top or at the back of the head" },
      ponytail: { label: { ja: "ポニーテール", en: "Ponytail" }, description: "A single ponytail" },
      twintails: { label: { ja: "ツインテール", en: "Pigtails" }, description: "Two pigtails or twin tails, one on each side" },
    },
  },
  ears_covered: {
    type: "noul",
    label: { ja: "耳が髪で隠れてる？", en: "Ears covered by hair?" },
    instructions: "Are the person's ears covered by hair?",
  },
  brow_thickness: {
    type: "choice",
    label: { ja: "眉の太さは？", en: "Brow thickness?" },
    instructions: "How thick are the person's eyebrows?",
    options: {
      thin: { label: { ja: "細い", en: "Thin" }, description: "Thin eyebrows" },
      medium: { label: { ja: "ふつう", en: "Medium" }, description: "Medium eyebrows" },
      thick: { label: { ja: "太い", en: "Thick" }, description: "Thick, bold eyebrows" },
    },
  },
  brow_shape: {
    type: "choice",
    label: { ja: "眉の形は？", en: "Brow shape?" },
    instructions: "What shape are the person's eyebrows?",
    options: {
      straight: { label: { ja: "まっすぐ", en: "Straight" }, description: "Straight, flat eyebrows" },
      arched: { label: { ja: "アーチ", en: "Arched" }, description: "Arched, curved eyebrows" },
    },
  },
  monolid: {
    type: "noul",
    label: { ja: "目は一重？", en: "Monolid?" },
    instructions: "Does the person have monolid eyes, with no visible double-eyelid crease?",
  },
  eye_size: {
    type: "choice",
    label: { ja: "目の大きさは？", en: "Eye size?" },
    instructions: "How big are the person's eyes relative to the face?",
    options: {
      small: { label: { ja: "小さめ", en: "Small" }, description: "Small or narrow eyes" },
      medium: { label: { ja: "ふつう", en: "Medium" }, description: "Average-sized eyes" },
      large: { label: { ja: "大きい", en: "Large" }, description: "Large, wide eyes" },
    },
  },
  eye_slant: {
    type: "choice",
    label: { ja: "たれ目？つり目？", en: "Eye slant?" },
    instructions: "Do the outer corners of the person's eyes slant up or down?",
    options: {
      droopy: { label: { ja: "たれ目", en: "Droopy" }, description: "Outer corners slant downward (droopy eyes)" },
      level: { label: { ja: "ふつう", en: "Level" }, description: "Eyes are roughly level" },
      upturned: { label: { ja: "つり目", en: "Upturned" }, description: "Outer corners slant upward (upturned eyes)" },
    },
  },
  eye_color: {
    type: "choice",
    label: { ja: "瞳の色は？", en: "Eye color?" },
    instructions: "What color are the irises of the person's eyes?",
    options: {
      dark_brown: { label: { ja: "こげ茶", en: "Dark brown" }, description: "Dark brown or almost black" },
      light_brown: { label: { ja: "明るい茶色", en: "Light brown" }, description: "Light brown or hazel" },
      blue: { label: { ja: "青", en: "Blue" }, description: "Blue" },
      green: { label: { ja: "緑", en: "Green" }, description: "Green" },
      gray: { label: { ja: "グレー", en: "Gray" }, description: "Gray" },
    },
  },
  long_lashes: {
    type: "noul",
    label: { ja: "まつげが長い？", en: "Long lashes?" },
    instructions: "Does the person have long, noticeable eyelashes?",
  },
  nose_size: {
    type: "choice",
    label: { ja: "鼻の大きさは？", en: "Nose size?" },
    instructions: "How large is the person's nose relative to the face?",
    options: {
      small: { label: { ja: "小さめ", en: "Small" }, description: "Small nose" },
      medium: { label: { ja: "ふつう", en: "Medium" }, description: "Average nose" },
      large: { label: { ja: "大きめ", en: "Large" }, description: "Large or prominent nose" },
    },
  },
  lip_thickness: {
    type: "choice",
    label: { ja: "唇の厚さは？", en: "Lip thickness?" },
    instructions: "How full are the person's lips?",
    options: {
      thin: { label: { ja: "薄め", en: "Thin" }, description: "Thin lips" },
      medium: { label: { ja: "ふつう", en: "Medium" }, description: "Average lips" },
      full: { label: { ja: "厚め", en: "Full" }, description: "Full, thick lips" },
    },
  },
  smiling: {
    type: "noul",
    label: { ja: "笑ってる？", en: "Smiling?" },
    instructions: "Is the person smiling?",
  },
  mouth_open: {
    type: "noul",
    label: { ja: "口が開いてる？", en: "Mouth open?" },
    instructions: "Is the person's mouth open?",
  },
  rosy_cheeks: {
    type: "noul",
    label: { ja: "ほっぺが赤い？", en: "Rosy cheeks?" },
    instructions: "Are the person's cheeks noticeably rosy or flushed?",
  },
  freckles: {
    type: "noul",
    label: { ja: "そばかすがある？", en: "Freckles?" },
    instructions: "Does the person have visible freckles?",
  },
  clothing_color: {
    type: "choice",
    label: { ja: "服の色は？", en: "Clothing color?" },
    instructions: "What is the main color of the clothes the person is wearing on the upper body?",
    options: {
      black: { label: { ja: "黒", en: "Black" }, description: "Black" },
      white: { label: { ja: "白", en: "White" }, description: "White" },
      gray: { label: { ja: "グレー", en: "Gray" }, description: "Gray" },
      navy: { label: { ja: "紺", en: "Navy" }, description: "Navy or dark blue" },
      blue: { label: { ja: "青", en: "Blue" }, description: "Blue or light blue" },
      green: { label: { ja: "緑", en: "Green" }, description: "Green" },
      red: { label: { ja: "赤", en: "Red" }, description: "Red" },
      orange: { label: { ja: "オレンジ", en: "Orange" }, description: "Orange" },
      yellow: { label: { ja: "黄色", en: "Yellow" }, description: "Yellow" },
      pink: { label: { ja: "ピンク", en: "Pink" }, description: "Pink" },
      purple: { label: { ja: "紫", en: "Purple" }, description: "Purple" },
      brown: { label: { ja: "茶色・ベージュ", en: "Brown / beige" }, description: "Brown or beige" },
    },
  },
  glasses: {
    type: "choice",
    label: { ja: "メガネは？", en: "Glasses?" },
    instructions: "Is the person wearing glasses? If so, what kind?",
    options: {
      none: { label: { ja: "なし", en: "None" }, description: "No glasses" },
      round: { label: { ja: "丸メガネ", en: "Round" }, description: "Glasses with round lenses" },
      square: { label: { ja: "四角メガネ", en: "Square" }, description: "Glasses with rectangular or square lenses" },
      sunglasses: { label: { ja: "サングラス", en: "Sunglasses" }, description: "Sunglasses with dark lenses" },
    },
  },
  mustache: {
    type: "choice",
    label: { ja: "口ひげは？", en: "Mustache?" },
    instructions: "Does the person have a mustache? If so, how thick is it?",
    options: {
      none: { label: { ja: "なし", en: "None" }, description: "No mustache" },
      thin: { label: { ja: "薄め", en: "Thin" }, description: "A thin or sparse mustache" },
      thick: { label: { ja: "濃いめ", en: "Thick" }, description: "A thick, bushy mustache" },
    },
  },
  beard: {
    type: "choice",
    label: { ja: "あごひげは？", en: "Beard?" },
    instructions: "What kind of beard does the person have?",
    options: {
      none: { label: { ja: "なし", en: "None" }, description: "Clean-shaven chin and jaw" },
      stubble: { label: { ja: "無精ひげ", en: "Stubble" }, description: "Light stubble or a five o'clock shadow" },
      goatee: { label: { ja: "あごだけ", en: "Goatee" }, description: "A goatee or hair only on the chin" },
      short: { label: { ja: "短め", en: "Short" }, description: "A short, trimmed beard along the jaw" },
      full: { label: { ja: "フル", en: "Full" }, description: "A full, thick beard" },
    },
  },
  sideburns: {
    type: "noul",
    label: { ja: "もみあげが長い？", en: "Long sideburns?" },
    instructions: "Does the person have long or prominent sideburns?",
  },
  earrings: {
    type: "noul",
    label: { ja: "ピアス・イヤリングをしてる？", en: "Earrings?" },
    instructions: "Is the person wearing visible earrings?",
  },
  hat: {
    type: "choice",
    label: { ja: "帽子は？", en: "Hat?" },
    instructions: "Is the person wearing a hat? If so, what kind?",
    options: {
      none: { label: { ja: "なし", en: "None" }, description: "No hat" },
      cap: { label: { ja: "キャップ", en: "Cap" }, description: "A baseball cap" },
      beanie: { label: { ja: "ニット帽", en: "Beanie" }, description: "A knit beanie" },
    },
  },
} as const satisfies Record<string, ChoiceDefinition | NoulDefinition>;

export type AvatarQuestionId = keyof typeof AVATAR_QUESTIONS;
type Question<K extends AvatarQuestionId> = (typeof AVATAR_QUESTIONS)[K];
export type OptionId<K extends AvatarQuestionId> = Question<K> extends { options: infer O } ? keyof O & string : never;

/** アバターが組み上がっていく順番と、各段階で使う質問 */
export const AVATAR_STAGES = [
  { id: "face", label: { ja: "輪郭", en: "Face" }, questions: ["face_shape", "skin_tone"] },
  { id: "clothes", label: { ja: "服", en: "Clothes" }, questions: ["clothing_color"] },
  { id: "hair", label: { ja: "髪", en: "Hair" }, questions: ["hair_length", "hair_color", "hair_texture", "hair_volume"] },
  { id: "hairstyle", label: { ja: "髪型", en: "Hairstyle" }, questions: ["bangs", "hair_parting", "hair_styled_up", "hair_updo", "ears_covered"] },
  { id: "brows", label: { ja: "眉", en: "Brows" }, questions: ["brow_thickness", "brow_shape"] },
  { id: "eyes", label: { ja: "目", en: "Eyes" }, questions: ["monolid", "eye_size", "eye_slant", "eye_color", "long_lashes"] },
  { id: "mouth", label: { ja: "鼻と口", en: "Nose & mouth" }, questions: ["nose_size", "lip_thickness", "smiling", "mouth_open"] },
  { id: "cheeks", label: { ja: "ほっぺ", en: "Cheeks" }, questions: ["rosy_cheeks", "freckles"] },
  { id: "beard", label: { ja: "ひげ", en: "Facial hair" }, questions: ["mustache", "beard", "sideburns"] },
  { id: "extras", label: { ja: "小物", en: "Accessories" }, questions: ["glasses", "earrings", "hat"] },
] as const satisfies readonly { id: string; label: Localized; questions: readonly AvatarQuestionId[] }[];

export type AvatarStageId = (typeof AVATAR_STAGES)[number]["id"];

export type AvatarAnswer<K extends AvatarQuestionId> =
  Question<K> extends { type: "choice" }
    ? { type: "choice"; choice: OptionId<K>; probabilities: Record<OptionId<K>, number>; confidence: number }
    : { type: "noul"; noul: number };

export type AvatarAnswers = { [K in AvatarQuestionId]: AvatarAnswer<K> };

export type AnalyzeRequest = {
  /** data:image/jpeg;base64,... */
  image: string;
  model: ClefModel;
};

export type AnalyzeResponse = {
  model: ClefModel;
  latencyMs: number;
  answers: AvatarAnswers;
};
