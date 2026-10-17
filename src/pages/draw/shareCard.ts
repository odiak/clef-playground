import { type DrawTopic, findTopic, topGuess } from "../../../shared/draw";
import type { Lang } from "../../../shared/i18n";
import { defineMessages } from "../../lib/i18n";
import { renderStrokes } from "./drawing";
import type { SavedDrawing } from "./history";

// SNS のタイムラインで大きく表示される 4:5 の縦長にする
const WIDTH = 1080;
const HEIGHT = 1350;
const DRAWING_SIZE = 800;
const FONT_FAMILY = '"M PLUS Rounded 1c", ui-rounded, "Hiragino Maru Gothic ProN", system-ui, sans-serif';
// フォントの読み込みに時間がかかるときは、待たずにほかのフォントで描く
const FONT_TIMEOUT_MS = 3000;

// index.css と同じ色
const ORANGE = "#f38020";
const YELLOW = "#faae40";
const CREAM = "#fff6ec";
const INK = "#2b2b33";
const INK_MUTED = "rgba(43, 43, 51, 0.6)";
const DOT = "rgba(243, 128, 32, 0.18)";

const MESSAGES = defineMessages({
  ja: {
    title: "描けるかな？",
    topic: "お題",
    hard: "むずかしい",
    passed: "合格！",
    failed: "ざんねん…",
    score: "お題の絵に見える確率",
    guessTopic: (label: string) => `Clef にも「${label}」に見えたみたい`,
    guessOther: (label: string) => `Clef には「${label}」に見えたみたい`,
    guessUnknown: "Clef には何の絵か分からなかったみたい",
    text: (label: string, percent: number, passed: boolean) =>
      passed
        ? `「描けるかな？」でお題「${label}」を描いて合格！（お題の絵に見える確率 ${percent}%）`
        : `「描けるかな？」でお題「${label}」を描いたけど、ざんねん…（お題の絵に見える確率 ${percent}%）`,
  },
  en: {
    title: "Can You Draw It?",
    topic: "Draw",
    hard: "Hard",
    passed: "Passed!",
    failed: "Not quite…",
    score: "Looks like the prompt",
    guessTopic: (label) => `Clef saw it as "${label}" too`,
    guessOther: (label) => `Clef thought it looked like "${label}"`,
    guessUnknown: "Clef couldn't tell what it was",
    text: (label, percent, passed) =>
      passed
        ? `I drew "${label}" in Can You Draw It? and passed with ${percent}%!`
        : `I tried drawing "${label}" in Can You Draw It?, but only scored ${percent}%…`,
  },
});

function topicOf(drawing: SavedDrawing): DrawTopic {
  // 保存した絵は、読み込むときにお題があるものだけに絞っている
  return findTopic(drawing.topicId)!;
}

function pageUrl(): string {
  return new URL("/draw", location.origin).toString();
}

/** シェアするときに画像といっしょに送る文 */
export function shareText(drawing: SavedDrawing, lang: Lang): string {
  const t = MESSAGES[lang];
  const percent = Math.round(drawing.judge.probability * 100);
  return `${t.text(topicOf(drawing).label[lang], percent, drawing.judge.passed)}\n${pageUrl()}`;
}

function font(weight: number, size: number): string {
  return `${weight} ${size}px ${FONT_FAMILY}`;
}

/** 日本語のフォントは文字の範囲ごとに分けて配信されるので、使う文字を指定して読み込んでおく */
async function loadFonts(texts: [weight: number, text: string][]): Promise<void> {
  const loading = Promise.all(texts.map(([weight, text]) => document.fonts.load(font(weight, 16), text)));
  await Promise.race([loading, new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS))]).catch(() => {});
}

/** 幅に収まるまで文字を小さくして、そのフォントにする */
function setFittingFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number): number {
  let fitted = size;
  ctx.font = font(weight, fitted);
  while (fitted > 16 && ctx.measureText(text).width > maxWidth) {
    fitted -= 2;
    ctx.font = font(weight, fitted);
  }
  return fitted;
}

/** 傾けて貼ったスティッカー。影は真下にずらした同じ形で描く */
function drawSticker(
  ctx: CanvasRenderingContext2D,
  { text, x, y, size, paddingX, height, fill, color, border }: {
    text: string;
    x: number;
    y: number;
    size: number;
    paddingX: number;
    height: number;
    fill: string;
    color: string;
    border: number;
  },
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.font = font(900, size);
  const width = ctx.measureText(text).width + paddingX * 2;
  const radius = height * 0.3;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2 + border * 1.5, width, height, radius);
  ctx.fill();
  ctx.fillStyle = fill;
  ctx.strokeStyle = INK;
  ctx.lineWidth = border;
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, radius);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** シェアする画像。描いた絵に、お題と判定結果、ページの URL を添える */
export async function createShareImage(drawing: SavedDrawing, lang: Lang): Promise<File> {
  const t = MESSAGES[lang];
  const topic = topicOf(drawing);
  const label = topic.label[lang];
  const { judge } = drawing;
  const percent = `${Math.round(judge.probability * 100)}%`;
  const guessId = topGuess(judge.guesses);
  const guessed = findTopic(guessId);
  const guess =
    guessId === topic.id ? t.guessTopic(label) : guessed ? t.guessOther(guessed.label[lang]) : t.guessUnknown;
  const result = judge.passed ? `🎉 ${t.passed}` : `😢 ${t.failed}`;
  const url = pageUrl().replace(/^https?:\/\//, "");

  await loadFonts([
    [800, `${t.topic}${t.score}${guess}${url}`],
    [900, `${label}${t.hard}${result}${percent}${t.title}Clef Playground`],
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not supported");

  // 背景はページと同じクリーム色のドット柄
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = DOT;
  for (let y = 22; y < HEIGHT; y += 44) {
    for (let x = 22; x < WIDTH; x += 44) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // お題。「むずかしい」は枠の角に貼るので、そのぶん下げる
  const pillTop = topic.hard ? 72 : 56;
  const pillHeight = 112;
  const pillGap = 20;
  const pillPaddingX = 48;
  ctx.font = font(800, 36);
  const topicWidth = ctx.measureText(t.topic).width;
  const labelSize = setFittingFont(ctx, label, 900, 72, WIDTH - 160 - pillPaddingX * 2 - topicWidth - pillGap);
  const labelWidth = ctx.measureText(label).width;
  const pillWidth = pillPaddingX * 2 + topicWidth + pillGap + labelWidth;
  const pillLeft = (WIDTH - pillWidth) / 2;
  const pillCenter = pillTop + pillHeight / 2;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(pillLeft, pillTop, pillWidth, pillHeight, pillHeight / 2);
  ctx.fill();
  ctx.stroke();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = INK_MUTED;
  ctx.font = font(800, 36);
  ctx.fillText(t.topic, pillLeft + pillPaddingX, pillCenter + 2);
  ctx.fillStyle = INK;
  ctx.font = font(900, labelSize);
  ctx.fillText(label, pillLeft + pillPaddingX + topicWidth + pillGap, pillCenter + 2);
  if (topic.hard) {
    ctx.font = font(900, 30);
    const badgeWidth = ctx.measureText(`🔥 ${t.hard}`).width + 40;
    drawSticker(ctx, {
      text: `🔥 ${t.hard}`,
      x: pillLeft + pillWidth - badgeWidth / 2 - 8,
      y: pillTop - 12,
      size: 30,
      paddingX: 20,
      height: 52,
      fill: YELLOW,
      color: INK,
      border: 4,
    });
  }

  // 描いた絵。カードと同じく、オレンジの影をずらして付ける
  const drawingLeft = (WIDTH - DRAWING_SIZE) / 2;
  const drawingTop = 216;
  const radius = 48;
  ctx.fillStyle = ORANGE;
  ctx.beginPath();
  ctx.roundRect(drawingLeft + 14, drawingTop + 14, DRAWING_SIZE, DRAWING_SIZE, radius);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(drawingLeft, drawingTop, DRAWING_SIZE, DRAWING_SIZE, radius);
  ctx.clip();
  ctx.translate(drawingLeft, drawingTop);
  renderStrokes(ctx, drawing.strokes, DRAWING_SIZE);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(drawingLeft, drawingTop, DRAWING_SIZE, DRAWING_SIZE, radius);
  ctx.stroke();

  // 合格かどうかは、絵の下の辺にまたがって貼る
  drawSticker(ctx, {
    text: result,
    x: WIDTH / 2,
    y: drawingTop + DRAWING_SIZE,
    size: 60,
    paddingX: 44,
    height: 108,
    fill: judge.passed ? ORANGE : "#ffffff",
    color: judge.passed ? "#ffffff" : INK,
    border: 6,
  });

  // 確率と、何の絵に見えたか
  ctx.textBaseline = "alphabetic";
  ctx.font = font(800, 34);
  const scoreWidth = ctx.measureText(t.score).width;
  ctx.font = font(900, 64);
  const percentWidth = ctx.measureText(percent).width;
  const scoreLeft = (WIDTH - scoreWidth - 20 - percentWidth) / 2;
  const scoreBaseline = 1162;
  ctx.textAlign = "left";
  ctx.fillStyle = INK_MUTED;
  ctx.font = font(800, 34);
  ctx.fillText(t.score, scoreLeft, scoreBaseline);
  ctx.fillStyle = judge.passed ? ORANGE : INK;
  ctx.font = font(900, 64);
  ctx.fillText(percent, scoreLeft + scoreWidth + 20, scoreBaseline);

  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  setFittingFont(ctx, `💭 ${guess}`, 800, 38, WIDTH - 120);
  ctx.fillText(`💭 ${guess}`, WIDTH / 2, 1228);

  // どこで遊べるか
  ctx.fillStyle = INK;
  ctx.font = font(900, 32);
  ctx.fillText(`${t.title} | Clef Playground`, WIDTH / 2, 1290);
  ctx.fillStyle = INK_MUTED;
  ctx.font = font(800, 26);
  ctx.fillText(url, WIDTH / 2, 1328);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG の作成に失敗しました"))), "image/png"),
  );
  return new File([blob], `clef-draw-${topic.id}.png`, { type: "image/png" });
}
