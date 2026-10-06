import type { ClefModel } from "./clef";

type ChoiceDefinition = {
  type: "choice";
  /** 画面に表示する質問 */
  label: string;
  /** Clef に渡す質問 */
  instructions: string;
  options: Record<string, { label: string; description: string }>;
};

type NoulDefinition = {
  type: "noul";
  label: string;
  instructions: string;
};

/** アバターを作るために Clef に聞く質問 */
export const AVATAR_QUESTIONS = {
  face_shape: {
    type: "choice",
    label: "顔の形は？",
    instructions: "What is the overall shape of the person's face?",
    options: {
      round: { label: "丸顔", description: "Round face with full cheeks; about as wide as it is long" },
      oval: { label: "卵型", description: "Oval face, slightly longer than wide, with a gently tapered chin" },
      square: { label: "四角", description: "Square face with a wide, strong jawline" },
      long: { label: "面長", description: "Long, narrow face" },
    },
  },
  skin_tone: {
    type: "choice",
    label: "肌の色は？",
    instructions: "What is the person's skin tone?",
    options: {
      light: { label: "明るめ", description: "Light or fair skin" },
      medium: { label: "ふつう", description: "Medium skin" },
      tan: { label: "小麦色", description: "Tan or olive skin" },
      deep: { label: "濃いめ", description: "Deep brown or dark skin" },
    },
  },
  hair_length: {
    type: "choice",
    label: "髪の長さは？",
    instructions: "How long is the person's hair?",
    options: {
      bald: { label: "なし", description: "Bald or almost no hair" },
      buzz: { label: "ベリーショート", description: "Very short buzz cut or crew cut" },
      short: { label: "ショート", description: "Short hair that ends above the ears or at the nape" },
      medium: { label: "ミディアム", description: "Medium-length hair reaching the chin or the neck" },
      long: { label: "ロング", description: "Long hair reaching the shoulders or below" },
    },
  },
  hair_color: {
    type: "choice",
    label: "髪の色は？",
    instructions: "What color is the person's hair?",
    options: {
      black: { label: "黒", description: "Black hair" },
      dark_brown: { label: "こげ茶", description: "Dark brown hair" },
      brown: { label: "茶色", description: "Light or medium brown hair" },
      blonde: { label: "金髪", description: "Blonde or golden hair" },
      gray: { label: "グレー", description: "Gray, silver, or white hair" },
      red: { label: "赤", description: "Red, auburn, or orange hair" },
      colorful: { label: "カラフル", description: "Dyed in a vivid color such as pink, blue, green, or purple" },
    },
  },
  hair_texture: {
    type: "choice",
    label: "髪質は？",
    instructions: "What is the texture of the person's hair?",
    options: {
      straight: { label: "ストレート", description: "Straight hair" },
      wavy: { label: "ウェーブ", description: "Wavy hair" },
      curly: { label: "くせ毛・カール", description: "Curly or coily hair" },
    },
  },
  hair_volume: {
    type: "choice",
    label: "髪のボリュームは？",
    instructions: "How much volume does the person's hair have?",
    options: {
      flat: { label: "ぺたんこ", description: "Flat, sleek hair lying close to the head" },
      normal: { label: "ふつう", description: "Average volume" },
      full: { label: "ふんわり", description: "Voluminous, puffy hair" },
    },
  },
  bangs: {
    type: "choice",
    label: "前髪は？",
    instructions: "How are the person's bangs (fringe) styled?",
    options: {
      none: { label: "おでこを出す", description: "No bangs; the forehead is visible" },
      full: { label: "下ろしている", description: "Straight bangs covering the forehead" },
      side: { label: "横に流す", description: "Side-swept bangs partly covering the forehead" },
    },
  },
  hair_parting: {
    type: "choice",
    label: "分け目は？",
    instructions: "Where is the person's hair parted, as seen in the image?",
    options: {
      center: { label: "真ん中", description: "Parted in the center" },
      left: { label: "左寄り", description: "Parted toward the left side of the image" },
      right: { label: "右寄り", description: "Parted toward the right side of the image" },
      none: { label: "なし", description: "No visible parting" },
    },
  },
  hair_styled_up: {
    type: "noul",
    label: "髪を立てている？",
    instructions: "Is the person's hair styled upward or spiky, for example with gel or wax?",
  },
  hair_updo: {
    type: "choice",
    label: "髪のまとめ方は？",
    instructions: "Is the person's hair tied or put up? If so, how?",
    options: {
      none: { label: "下ろしている", description: "Hair is down and loose, or too short to tie" },
      bun: { label: "お団子", description: "A bun on top or at the back of the head" },
      ponytail: { label: "ポニーテール", description: "A single ponytail" },
      twintails: { label: "ツインテール", description: "Two pigtails or twin tails, one on each side" },
    },
  },
  ears_covered: {
    type: "noul",
    label: "耳が髪で隠れてる？",
    instructions: "Are the person's ears covered by hair?",
  },
  brow_thickness: {
    type: "choice",
    label: "眉の太さは？",
    instructions: "How thick are the person's eyebrows?",
    options: {
      thin: { label: "細い", description: "Thin eyebrows" },
      medium: { label: "ふつう", description: "Medium eyebrows" },
      thick: { label: "太い", description: "Thick, bold eyebrows" },
    },
  },
  brow_shape: {
    type: "choice",
    label: "眉の形は？",
    instructions: "What shape are the person's eyebrows?",
    options: {
      straight: { label: "まっすぐ", description: "Straight, flat eyebrows" },
      arched: { label: "アーチ", description: "Arched, curved eyebrows" },
    },
  },
  monolid: {
    type: "noul",
    label: "目は一重？",
    instructions: "Does the person have monolid eyes, with no visible double-eyelid crease?",
  },
  eye_size: {
    type: "choice",
    label: "目の大きさは？",
    instructions: "How big are the person's eyes relative to the face?",
    options: {
      small: { label: "小さめ", description: "Small or narrow eyes" },
      medium: { label: "ふつう", description: "Average-sized eyes" },
      large: { label: "大きい", description: "Large, wide eyes" },
    },
  },
  eye_slant: {
    type: "choice",
    label: "たれ目？つり目？",
    instructions: "Do the outer corners of the person's eyes slant up or down?",
    options: {
      droopy: { label: "たれ目", description: "Outer corners slant downward (droopy eyes)" },
      level: { label: "ふつう", description: "Eyes are roughly level" },
      upturned: { label: "つり目", description: "Outer corners slant upward (upturned eyes)" },
    },
  },
  eye_color: {
    type: "choice",
    label: "瞳の色は？",
    instructions: "What color are the irises of the person's eyes?",
    options: {
      dark_brown: { label: "こげ茶", description: "Dark brown or almost black" },
      light_brown: { label: "明るい茶色", description: "Light brown or hazel" },
      blue: { label: "青", description: "Blue" },
      green: { label: "緑", description: "Green" },
      gray: { label: "グレー", description: "Gray" },
    },
  },
  long_lashes: {
    type: "noul",
    label: "まつげが長い？",
    instructions: "Does the person have long, noticeable eyelashes?",
  },
  nose_size: {
    type: "choice",
    label: "鼻の大きさは？",
    instructions: "How large is the person's nose relative to the face?",
    options: {
      small: { label: "小さめ", description: "Small nose" },
      medium: { label: "ふつう", description: "Average nose" },
      large: { label: "大きめ", description: "Large or prominent nose" },
    },
  },
  lip_thickness: {
    type: "choice",
    label: "唇の厚さは？",
    instructions: "How full are the person's lips?",
    options: {
      thin: { label: "薄め", description: "Thin lips" },
      medium: { label: "ふつう", description: "Average lips" },
      full: { label: "厚め", description: "Full, thick lips" },
    },
  },
  smiling: {
    type: "noul",
    label: "笑ってる？",
    instructions: "Is the person smiling?",
  },
  mouth_open: {
    type: "noul",
    label: "口が開いてる？",
    instructions: "Is the person's mouth open?",
  },
  rosy_cheeks: {
    type: "noul",
    label: "ほっぺが赤い？",
    instructions: "Are the person's cheeks noticeably rosy or flushed?",
  },
  freckles: {
    type: "noul",
    label: "そばかすがある？",
    instructions: "Does the person have visible freckles?",
  },
  clothing_color: {
    type: "choice",
    label: "服の色は？",
    instructions: "What is the main color of the clothes the person is wearing on the upper body?",
    options: {
      black: { label: "黒", description: "Black" },
      white: { label: "白", description: "White" },
      gray: { label: "グレー", description: "Gray" },
      navy: { label: "紺", description: "Navy or dark blue" },
      blue: { label: "青", description: "Blue or light blue" },
      green: { label: "緑", description: "Green" },
      red: { label: "赤", description: "Red" },
      orange: { label: "オレンジ", description: "Orange" },
      yellow: { label: "黄色", description: "Yellow" },
      pink: { label: "ピンク", description: "Pink" },
      purple: { label: "紫", description: "Purple" },
      brown: { label: "茶色・ベージュ", description: "Brown or beige" },
    },
  },
  glasses: {
    type: "choice",
    label: "メガネは？",
    instructions: "Is the person wearing glasses? If so, what kind?",
    options: {
      none: { label: "なし", description: "No glasses" },
      round: { label: "丸メガネ", description: "Glasses with round lenses" },
      square: { label: "四角メガネ", description: "Glasses with rectangular or square lenses" },
      sunglasses: { label: "サングラス", description: "Sunglasses with dark lenses" },
    },
  },
  mustache: {
    type: "choice",
    label: "口ひげは？",
    instructions: "Does the person have a mustache? If so, how thick is it?",
    options: {
      none: { label: "なし", description: "No mustache" },
      thin: { label: "薄め", description: "A thin or sparse mustache" },
      thick: { label: "濃いめ", description: "A thick, bushy mustache" },
    },
  },
  beard: {
    type: "choice",
    label: "あごひげは？",
    instructions: "What kind of beard does the person have?",
    options: {
      none: { label: "なし", description: "Clean-shaven chin and jaw" },
      stubble: { label: "無精ひげ", description: "Light stubble or a five o'clock shadow" },
      goatee: { label: "あごだけ", description: "A goatee or hair only on the chin" },
      short: { label: "短め", description: "A short, trimmed beard along the jaw" },
      full: { label: "フル", description: "A full, thick beard" },
    },
  },
  sideburns: {
    type: "noul",
    label: "もみあげが長い？",
    instructions: "Does the person have long or prominent sideburns?",
  },
  earrings: {
    type: "noul",
    label: "ピアス・イヤリングをしてる？",
    instructions: "Is the person wearing visible earrings?",
  },
  hat: {
    type: "choice",
    label: "帽子は？",
    instructions: "Is the person wearing a hat? If so, what kind?",
    options: {
      none: { label: "なし", description: "No hat" },
      cap: { label: "キャップ", description: "A baseball cap" },
      beanie: { label: "ニット帽", description: "A knit beanie" },
    },
  },
} as const satisfies Record<string, ChoiceDefinition | NoulDefinition>;

export type AvatarQuestionId = keyof typeof AVATAR_QUESTIONS;
type Question<K extends AvatarQuestionId> = (typeof AVATAR_QUESTIONS)[K];
export type OptionId<K extends AvatarQuestionId> = Question<K> extends { options: infer O } ? keyof O & string : never;

/** アバターが組み上がっていく順番と、各段階で使う質問 */
export const AVATAR_STAGES = [
  { id: "face", label: "輪郭", questions: ["face_shape", "skin_tone"] },
  { id: "clothes", label: "服", questions: ["clothing_color"] },
  { id: "hair", label: "髪", questions: ["hair_length", "hair_color", "hair_texture", "hair_volume"] },
  { id: "hairstyle", label: "髪型", questions: ["bangs", "hair_parting", "hair_styled_up", "hair_updo", "ears_covered"] },
  { id: "brows", label: "眉", questions: ["brow_thickness", "brow_shape"] },
  { id: "eyes", label: "目", questions: ["monolid", "eye_size", "eye_slant", "eye_color", "long_lashes"] },
  { id: "mouth", label: "鼻と口", questions: ["nose_size", "lip_thickness", "smiling", "mouth_open"] },
  { id: "cheeks", label: "ほっぺ", questions: ["rosy_cheeks", "freckles"] },
  { id: "beard", label: "ひげ", questions: ["mustache", "beard", "sideburns"] },
  { id: "extras", label: "小物", questions: ["glasses", "earrings", "hat"] },
] as const satisfies readonly { id: string; label: string; questions: readonly AvatarQuestionId[] }[];

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
