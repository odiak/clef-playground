import type { AvatarAnswers, OptionId } from "../../../shared/avatar";

/** アバターを描くためのパラメーター */
export type AvatarParams = {
  faceShape: OptionId<"face_shape">;
  skinTone: OptionId<"skin_tone">;
  hairLength: OptionId<"hair_length">;
  hairColor: OptionId<"hair_color">;
  hairTexture: OptionId<"hair_texture">;
  hairVolume: OptionId<"hair_volume">;
  bangs: OptionId<"bangs">;
  hairParting: OptionId<"hair_parting">;
  hairStyledUp: boolean;
  hairUpdo: OptionId<"hair_updo">;
  earsCovered: boolean;
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
  mustache: OptionId<"mustache">;
  beard: OptionId<"beard">;
  sideburns: boolean;
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
    hairVolume: answers.hair_volume.choice,
    bangs: answers.bangs.choice,
    hairParting: answers.hair_parting.choice,
    hairStyledUp: yes(answers.hair_styled_up),
    hairUpdo: answers.hair_updo.choice,
    earsCovered: yes(answers.ears_covered),
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
    mustache: answers.mustache.choice,
    beard: answers.beard.choice,
    sideburns: yes(answers.sideburns),
    earrings: yes(answers.earrings),
    hat: answers.hat.choice,
  };
}
