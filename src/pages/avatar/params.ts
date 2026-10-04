import type { AvatarAnswers, OptionId } from "../../../shared/avatar";

/** アバターを描くためのパラメーター */
export type AvatarParams = {
  faceShape: OptionId<"face_shape">;
  skinTone: OptionId<"skin_tone">;
  hairLength: OptionId<"hair_length">;
  hairColor: OptionId<"hair_color">;
  hairTexture: OptionId<"hair_texture">;
  bangs: OptionId<"bangs">;
  hairTied: boolean;
  browThickness: OptionId<"brow_thickness">;
  browShape: OptionId<"brow_shape">;
  monolid: boolean;
  eyeSize: OptionId<"eye_size">;
  eyeSlant: OptionId<"eye_slant">;
  eyeColor: OptionId<"eye_color">;
  longLashes: boolean;
  noseSize: OptionId<"nose_size">;
  lipThickness: OptionId<"lip_thickness">;
  smiling: boolean;
  mouthOpen: boolean;
  rosyCheeks: boolean;
  freckles: boolean;
  clothingColor: OptionId<"clothing_color">;
  glasses: OptionId<"glasses">;
  facialHair: OptionId<"facial_hair">;
  earrings: boolean;
  hat: OptionId<"hat">;
};

const yes = (answer: { noul: number }) => answer.noul >= 0.5;

export function toAvatarParams(answers: AvatarAnswers): AvatarParams {
  return {
    faceShape: answers.face_shape.choice,
    skinTone: answers.skin_tone.choice,
    hairLength: answers.hair_length.choice,
    hairColor: answers.hair_color.choice,
    hairTexture: answers.hair_texture.choice,
    bangs: answers.bangs.choice,
    hairTied: yes(answers.hair_tied),
    browThickness: answers.brow_thickness.choice,
    browShape: answers.brow_shape.choice,
    monolid: yes(answers.monolid),
    eyeSize: answers.eye_size.choice,
    eyeSlant: answers.eye_slant.choice,
    eyeColor: answers.eye_color.choice,
    longLashes: yes(answers.long_lashes),
    noseSize: answers.nose_size.choice,
    lipThickness: answers.lip_thickness.choice,
    smiling: yes(answers.smiling),
    mouthOpen: yes(answers.mouth_open),
    rosyCheeks: yes(answers.rosy_cheeks),
    freckles: yes(answers.freckles),
    clothingColor: answers.clothing_color.choice,
    glasses: answers.glasses.choice,
    facialHair: answers.facial_hair.choice,
    earrings: yes(answers.earrings),
    hat: answers.hat.choice,
  };
}
