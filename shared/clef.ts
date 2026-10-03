export const CLEF_MODELS = ["clef-flash", "clef"] as const;
export type ClefModel = (typeof CLEF_MODELS)[number];

export function isClefModel(value: unknown): value is ClefModel {
  return CLEF_MODELS.includes(value as ClefModel);
}
