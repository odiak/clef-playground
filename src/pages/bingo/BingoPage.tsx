import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BINGO_SIZES,
  BINGO_THEMES,
  type BingoItem,
  type BingoJudgeResponse,
  type BingoSize,
  type BingoTheme,
  findItem,
  findTheme,
} from "../../../shared/bingo";
import type { ClefModel } from "../../../shared/clef";
import { DetailsCard } from "../../components/DetailsCard";
import { MODEL_LABEL, ModelToggle } from "../../components/ModelToggle";
import { Notice } from "../../components/Notice";
import { TopBar } from "../../components/TopBar";
import { captureSquareFrame } from "../../lib/camera/capture";
import { useCamera } from "../../lib/camera/useCamera";
import { errorMessage } from "../../lib/errors";
import { defineMessages, useLang, useMessages } from "../../lib/i18n";
import { judgeBingo } from "./api";
import { BingoCard } from "./BingoCard";
import { type PhotoEntry, PhotoViewer } from "./PhotoViewer";
import {
  applyJudge,
  type BingoGame,
  createGame,
  giveUp,
  isOpen,
  loadGame,
  loadSize,
  remainingItemIds,
  saveGame,
  saveSize,
  shuffle,
} from "./game";

type Shot =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "live" }
  | { kind: "judging"; photo: string }
  | { kind: "result"; photo: string; judge: BingoJudgeResponse }
  | { kind: "error"; error: unknown; photo?: string };

// これ以上の確率なら、見つからなかったときに「おしい」と出す
const NEAR_MISS_THRESHOLD = 0.3;
// マスに残す写真の大きさ。タップして拡大したときにも見られる大きさにする
const THUMBNAIL_SIZE = 400;

const MESSAGES = defineMessages({
  ja: {
    title: "写真ビンゴ",
    lead: "お題を探して撮影！Clef が認めたらマスに穴が空くよ",
    howTo: [
      "選んだテーマのお題がカードに並びます",
      "見つけたらカメラで撮影。1 枚に何個写ってもOK",
      "Clef が認めたらマスに穴が空きます",
      "縦・横・斜めのどれかが揃えばビンゴ！",
    ],
    themeLabel: "テーマ",
    themeNote: "みんなで遊ぶときは、同じテーマを選んで競争しよう！",
    itemCount: (count: number) => `お題 ${count} 種`,
    sizeLabel: "カードの大きさ",
    sizes: { 3: { name: "3×3", note: "サクッと 9 マス" }, 5: { name: "5×5", note: "じっくり 25 マス" } },
    start: "はじめる",
    reshuffle: "🔄 カードを引き直す",
    elapsed: "経過時間",
    shots: "撮影",
    shotCount: (count: number) => `${count} 枚`,
    photoAlt: "撮影した写真",
    starting: "カメラを起動中…",
    intro: "お題を見つけたら撮影しよう",
    introNote: "画面に映したものや印刷した写真はダメ。実物を撮ってね",
    judging: "Clef が判定中…",
    startCamera: "📷 カメラを起動",
    shoot: "📸 撮影する",
    next: "📸 次を撮る",
    found: "ゲット！",
    notFound: "見つからなかった…",
    nearMiss: (label: string) => `おしい！「${label}」かも？もう少し大きく写してみて`,
    notReal: "画面に映したものや印刷物みたい…",
    notRealNote: "画面に映した画像や印刷された写真は使えません。実物を撮ってね！",
    giveUp: "ギブアップ",
    giveUpConfirm: "ギブアップしますか？このカードは終了になります",
    bingo: "BINGO!",
    bingoNote: (time: string, shots: number) => `${time} で、${shots} 枚撮ってビンゴ！`,
    gaveUp: "ギブアップ",
    gaveUpNote: (opened: number, total: number) => `${total} マス中 ${opened} マスに穴を空けました`,
    newCard: "新しいカードで遊ぶ",
    details: "🔍 モデルと判定の詳細",
    detailsEmpty: "撮影すると、ここに Clef の判定結果が表示されます",
    judgment: "Clef の判定",
    real: "実物を撮った確率",
    privacy:
      "撮影した写真は判定のためだけに送信され、サーバーには保存されません。穴を空けたマスの写真（縮小版）は、続きから遊べるようにこのブラウザの中だけに保存されます。",
  },
  en: {
    title: "Photo Bingo",
    lead: "Find things and snap them! Clef punches the square when it agrees",
    howTo: [
      "Your card is filled with things to find from the theme you pick",
      "Found one? Take a photo. Several in one shot is fine too",
      "When Clef recognizes it, the square gets punched",
      "Complete a row, column, or diagonal for BINGO!",
    ],
    themeLabel: "Theme",
    themeNote: "Playing with friends? Pick the same theme and race each other!",
    itemCount: (count) => `${count} things`,
    sizeLabel: "Card size",
    sizes: { 3: { name: "3×3", note: "Quick · 9 squares" }, 5: { name: "5×5", note: "Classic · 25 squares" } },
    start: "Start",
    reshuffle: "🔄 New card",
    elapsed: "Time",
    shots: "Photos",
    shotCount: (count) => `${count}`,
    photoAlt: "Your photo",
    starting: "Starting the camera…",
    intro: "Found something? Take a photo!",
    introNote: "No pictures on screens or printed photos. Shoot the real thing!",
    judging: "Clef is judging…",
    startCamera: "📷 Start camera",
    shoot: "📸 Take photo",
    next: "📸 Next photo",
    found: "Got it!",
    notFound: "Nothing found…",
    nearMiss: (label) => `So close! Maybe "${label}"? Try getting it bigger in the frame`,
    notReal: "Looks like a screen or a print…",
    notRealNote: "Pictures on a screen or printed photos don't count. Shoot the real thing!",
    giveUp: "Give up",
    giveUpConfirm: "Give up? This card will end",
    bingo: "BINGO!",
    bingoNote: (time, shots) => `BINGO in ${time} with ${shots} photo${shots === 1 ? "" : "s"}!`,
    gaveUp: "Gave up",
    gaveUpNote: (opened, total) => `You punched ${opened} of ${total} squares`,
    newCard: "Play a new card",
    details: "🔍 Model & judgment details",
    detailsEmpty: "Take a photo to see Clef's judgment here",
    judgment: "Clef's judgment",
    real: "Real object",
    privacy:
      "Photos are sent only for judging and are never stored on the server. Small copies of the photos on punched squares are kept only in this browser so you can pick up where you left off.",
  },
});

type Messages = (typeof MESSAGES)["ja"];

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** 1 秒ごとに今の時刻を返す。止めているあいだは更新しない */
function useNow(running: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  return now;
}

export function BingoPage() {
  const { lang } = useLang();
  const t = useMessages(MESSAGES);
  const camera = useCamera("environment");
  const [game, setGameState] = useState<BingoGame | null>(loadGame);
  const [size, setSize] = useState<BingoSize>(loadSize);
  const [shot, setShot] = useState<Shot>({ kind: "idle" });
  const [model, setModel] = useState<ClefModel>("clef");

  const setGame = (next: BingoGame | null) => {
    setGameState(next);
    saveGame(next);
  };

  // 判定の途中でカードを配り直したり、画面を離れたりしたら、その判定結果は捨てる
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  }, [game]);
  const runIdRef = useRef(0);
  useEffect(() => {
    return () => {
      runIdRef.current++;
    };
  }, []);

  const isPlaying = game !== null && !game.result;
  const now = useNow(isPlaying);
  const theme = game ? findTheme(game.themeId)! : null;
  const hasPunched = game?.cells.some((cell) => cell.itemId !== null && isOpen(cell)) ?? false;
  const isJudging = shot.kind === "judging";

  // ビンゴやギブアップの瞬間だけ結果を大きく出す。リロード後に見返すときは出さない
  const [celebratingGameId, setCelebratingGameId] = useState<string | null>(null);

  // 拡大表示する写真。見つけた順に並べて、前後に送れるようにする
  const photoEntries = useMemo<PhotoEntry[]>(
    () =>
      (game?.cells ?? [])
        .flatMap((cell) =>
          cell.itemId !== null && cell.photo && cell.openedAt !== undefined
            ? [{ itemId: cell.itemId, photo: cell.photo, openedAt: cell.openedAt }]
            : [],
        )
        .sort((a, b) => a.openedAt - b.openedAt),
    [game],
  );
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const openPhoto = (cellIndex: number) => {
    const cell = game?.cells[cellIndex];
    const index = photoEntries.findIndex((entry) => entry.itemId === cell?.itemId);
    if (index >= 0) setViewingIndex(index);
  };
  const closePhoto = useCallback(() => setViewingIndex(null), []);

  const deal = (nextSize: BingoSize, nextTheme: BingoTheme) => {
    runIdRef.current++;
    setSize(nextSize);
    saveSize(nextSize);
    setGame(createGame(nextSize, nextTheme));
    setShot({ kind: "idle" });
  };

  // 穴が空く前なら、同じテーマでお題を選び直せる
  const reshuffle = () => {
    if (!game || !theme) return;
    setGame(createGame(game.size, theme));
    if (shot.kind === "result" || shot.kind === "error") setShot({ kind: camera.isActive ? "live" : "idle" });
  };

  const startCamera = async () => {
    setShot({ kind: "starting" });
    try {
      await camera.start();
      setShot({ kind: "live" });
    } catch (error) {
      setShot({ kind: "error", error });
    }
  };

  const shoot = async () => {
    const current = gameRef.current;
    const video = camera.videoRef.current;
    if (!current || current.result || !video) return;
    const runId = ++runIdRef.current;

    let photo: string;
    let thumbnail: string;
    try {
      photo = captureSquareFrame(video, 512, false);
      thumbnail = captureSquareFrame(video, THUMBNAIL_SIZE, false);
    } catch (error) {
      camera.stop();
      setShot({ kind: "error", error });
      return;
    }
    setShot({ kind: "judging", photo });

    try {
      const judge = await judgeBingo(photo, model, current.themeId, remainingItemIds(current));
      const latest = gameRef.current;
      if (runId !== runIdRef.current || !latest || latest.id !== current.id) return;
      const next = applyJudge(latest, judge.found, thumbnail, Date.now());
      setGame(next);
      setShot({ kind: "result", photo, judge });
      if (next.result) {
        camera.stop();
        setCelebratingGameId(next.id);
      }
    } catch (error) {
      if (runId === runIdRef.current) setShot({ kind: "error", error, photo });
    }
  };

  const confirmGiveUp = () => {
    if (!game || !window.confirm(t.giveUpConfirm)) return;
    runIdRef.current++;
    camera.stop();
    setGame(giveUp(game, Date.now()));
    setCelebratingGameId(game.id);
    setShot({ kind: "idle" });
  };

  const newCard = () => {
    runIdRef.current++;
    camera.stop();
    setGame(null);
    setShot({ kind: "idle" });
  };

  const judge = shot.kind === "result" ? shot.judge : null;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <title>{`${t.title} | Clef Playground`}</title>
      <TopBar back />
      <div>
        <h1 className="text-2xl font-black">{t.title}</h1>
        <p className="text-xs font-bold text-ink/70">{t.lead}</p>
      </div>

      {!game || !theme ? (
        <Setup size={size} onDeal={deal} t={t} />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1 font-black">
              <span className="text-xl">{theme.emoji}</span>
              {theme.label[lang]}
            </p>
            <dl className="flex shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white text-center text-[10px] font-extrabold">
              <div className="border-r-2 border-ink px-2.5 py-0.5">
                <dt className="text-ink/60">{t.elapsed}</dt>
                <dd className="text-base leading-tight font-black tabular-nums">
                  {formatDuration((game.finishedAt ?? now) - game.startedAt)}
                </dd>
              </div>
              <div className="px-2.5 py-0.5">
                <dt className="text-ink/60">{t.shots}</dt>
                <dd className="text-base leading-tight font-black tabular-nums">{t.shotCount(game.shots)}</dd>
              </div>
            </dl>
          </div>

          {/* 結果のスティッカーをカードの上辺に貼るぶん、上を空けておく */}
          <div className={`relative ${game.result ? "mt-10" : ""}`}>
            <BingoCard game={game} onOpenPhoto={openPhoto} />
            {game.result && (
              <ResultBadge key={game.id} result={game.result} celebrate={celebratingGameId === game.id} t={t} />
            )}
          </div>

          {isPlaying ? (
            <>
              <Stage shot={shot} camera={camera} theme={theme} t={t} />
              <div className="flex justify-center pt-1">
                {shot.kind === "judging" ? (
                  <button type="button" className="btn-pop min-w-60" disabled>
                    {t.judging}
                  </button>
                ) : camera.isActive && shot.kind === "live" ? (
                  <button type="button" className="btn-pop min-w-60" onClick={shoot}>
                    {t.shoot}
                  </button>
                ) : camera.isActive && (shot.kind === "result" || shot.kind === "error") ? (
                  <button type="button" className="btn-pop min-w-60" onClick={() => setShot({ kind: "live" })}>
                    {t.next}
                  </button>
                ) : (
                  <button type="button" className="btn-pop min-w-60" onClick={startCamera} disabled={shot.kind === "starting"}>
                    {shot.kind === "result" ? t.next : t.startCamera}
                  </button>
                )}
              </div>

              {shot.kind === "error" && <Notice>😵 {errorMessage(shot.error, lang)}</Notice>}
              {judge && !judge.isReal && <Notice>📵 {t.notRealNote}</Notice>}

              <div className="flex justify-center gap-4 text-xs font-extrabold text-ink/50">
                {!hasPunched && (
                  <button type="button" onClick={reshuffle} disabled={isJudging} className="underline underline-offset-2 hover:text-cf-orange disabled:opacity-50">
                    {t.reshuffle}
                  </button>
                )}
                <button type="button" onClick={confirmGiveUp} disabled={isJudging} className="underline underline-offset-2 hover:text-cf-orange disabled:opacity-50">
                  🏳️ {t.giveUp}
                </button>
              </div>
            </>
          ) : (
            <FinishedCard game={game} onNewCard={newCard} t={t} />
          )}
        </>
      )}

      <DetailsCard title={t.details} aside={MODEL_LABEL[model].name}>
        <ModelToggle value={model} onChange={setModel} disabled={isJudging} />
        {judge && theme ? (
          <JudgeDetails judge={judge} theme={theme} t={t} />
        ) : (
          <p className="text-center text-xs font-bold text-ink/50">{t.detailsEmpty}</p>
        )}
      </DetailsCard>

      <p className="text-center text-xs font-bold text-ink/50">{t.privacy}</p>

      {game && theme && viewingIndex !== null && photoEntries[viewingIndex] && (
        <PhotoViewer
          entries={photoEntries}
          index={viewingIndex}
          theme={theme}
          startedAt={game.startedAt}
          formatTime={formatDuration}
          onChange={setViewingIndex}
          onClose={closePhoto}
        />
      )}
    </div>
  );
}

function Setup({
  size,
  onDeal,
  t,
}: {
  size: BingoSize;
  onDeal: (size: BingoSize, theme: BingoTheme) => void;
  t: Messages;
}) {
  const { lang } = useLang();
  const [selected, setSelected] = useState(size);
  // どのテーマも選ばれやすいよう、並び順と最初に選ばれているテーマはランダムにする
  const [themes] = useState(() => shuffle(BINGO_THEMES));
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  return (
    <div className="card-pop space-y-5 p-5">
      <ol className="space-y-2">
        {t.howTo.map((step, index) => (
          <li key={step} className="flex items-start gap-2 text-sm font-bold">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cf-orange text-xs font-black text-white">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <p className="text-center text-xs font-extrabold text-ink/60">{t.themeLabel}</p>
        <div role="radiogroup" aria-label={t.themeLabel} className="grid grid-cols-2 gap-2">
          {themes.map((theme) => {
            const isSelected = theme.id === selectedTheme.id;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedTheme(theme)}
                className={`flex flex-col items-center rounded-2xl border-[3px] border-ink px-2 py-2 text-center transition-colors ${
                  isSelected ? "bg-cf-orange text-white" : "bg-white hover:bg-cf-cream"
                }`}
              >
                <span className="text-3xl">{theme.emoji}</span>
                <span className="mt-1 text-sm leading-tight font-black">{theme.label[lang]}</span>
                <span className={`text-[10px] font-bold ${isSelected ? "text-white/85" : "text-ink/50"}`}>
                  {t.itemCount(theme.items.length)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-center text-[11px] font-bold text-ink/60">{t.themeNote}</p>
      </div>

      <div className="space-y-2">
        <p className="text-center text-xs font-extrabold text-ink/60">{t.sizeLabel}</p>
        <div role="radiogroup" aria-label={t.sizeLabel} className="grid grid-cols-2 gap-1 rounded-full border-[3px] border-ink bg-white p-1">
          {BINGO_SIZES.map((value) => {
            const isSelected = value === selected;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(value)}
                className={`rounded-full px-3 py-1 transition-colors ${isSelected ? "bg-cf-orange text-white" : "text-ink/70 hover:bg-cf-cream"}`}
              >
                <span className="block text-lg leading-tight font-black">{t.sizes[value].name}</span>
                <span className={`block text-[10px] font-bold ${isSelected ? "text-white/85" : "text-ink/50"}`}>
                  {t.sizes[value].note}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <button type="button" className="btn-pop min-w-60" onClick={() => onDeal(selected, selectedTheme)}>
          {t.start}
        </button>
      </div>
    </div>
  );
}

function Stage({
  shot,
  camera,
  theme,
  t,
}: {
  shot: Shot;
  camera: ReturnType<typeof useCamera>;
  theme: BingoTheme;
  t: Messages;
}) {
  const { lang } = useLang();
  const photo = "photo" in shot ? shot.photo : undefined;
  const showPhoto = photo && shot.kind !== "live";
  const judge = shot.kind === "result" ? shot.judge : null;
  const foundItems = (judge?.found ?? []).flatMap((id) => findItem(theme, id) ?? []);

  // 見つからなかったときは、一番惜しかったお題を教える
  const nearMiss = (() => {
    if (!judge || !judge.isReal || judge.found.length > 0) return null;
    const [id, probability] = Object.entries(judge.probabilities).reduce(
      (best, entry) => (entry[1] > best[1] ? entry : best),
      ["", 0],
    );
    return probability >= NEAR_MISS_THRESHOLD ? findItem(theme, id) : null;
  })();

  return (
    <div className="space-y-2">
      <div className="card-pop relative aspect-square overflow-hidden bg-ink">
        <video
          ref={camera.videoRef}
          muted
          playsInline
          autoPlay
          className={`absolute inset-0 size-full object-cover ${camera.isActive && !showPhoto ? "" : "invisible"}`}
        />
        {showPhoto && <img src={photo} alt={t.photoAlt} className="absolute inset-0 size-full object-cover" />}

        {!camera.isActive && !showPhoto && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cf-peach p-6 text-center">
            <span className="animate-float text-7xl">{shot.kind === "starting" ? "📷" : "🔍"}</span>
            <p className="font-black">{shot.kind === "starting" ? t.starting : t.intro}</p>
            <p className="text-xs font-bold text-ink/60">{t.introNote}</p>
          </div>
        )}

        {/* 撮る範囲が分かるように、四隅にガイドを出す */}
        {camera.isActive && shot.kind === "live" && (
          <div className="pointer-events-none absolute inset-6">
            {["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "right-0 bottom-0 border-r-4 border-b-4"].map(
              (position) => (
                <span key={position} className={`absolute size-10 rounded-sm border-white/80 ${position}`} />
              ),
            )}
          </div>
        )}

        {shot.kind === "judging" && (
          <>
            <div className="pointer-events-none absolute inset-0 animate-flash bg-white" />
            <StageSticker className="bg-white text-ink">
              <span className="inline-block animate-spin">⏳</span> {t.judging}
            </StageSticker>
          </>
        )}

        {judge && (
          <>
            <div className="absolute inset-0 bg-linear-to-b from-ink/40 via-transparent via-40% to-ink/40" />
            {!judge.isReal ? (
              <StageSticker className="bg-ink text-white">📵 {t.notReal}</StageSticker>
            ) : foundItems.length > 0 ? (
              <StageSticker className="bg-cf-orange text-white">🎉 {t.found}</StageSticker>
            ) : (
              <StageSticker className="bg-white text-ink">🤔 {t.notFound}</StageSticker>
            )}
            {foundItems.length > 0 && (
              <ul className="absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-1.5">
                {foundItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="animate-pop-in rounded-full border-[3px] border-ink bg-white px-3 py-1 text-sm font-black shadow-[0_3px_0_0_var(--color-ink)]"
                    style={{ animationDelay: `${150 + index * 120}ms` }}
                  >
                    {item.emoji} {item.label[lang]}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {nearMiss && <Notice>💡 {t.nearMiss(nearMiss.label[lang])}</Notice>}
    </div>
  );
}

function StageSticker({ className, children }: { className: string; children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
      <p
        className={`animate-pop-in -rotate-3 rounded-2xl border-[3px] border-ink px-4 py-1 text-lg font-black whitespace-nowrap shadow-[0_4px_0_0_var(--color-ink)] ${className}`}
      >
        {children}
      </p>
    </div>
  );
}

// 終わった瞬間はカードの真ん中に大きく出し、少ししたら縮めてカードの上辺に移す
const CELEBRATE_MS = 1600;

function ResultBadge({ result, celebrate, t }: { result: "bingo" | "gaveUp"; celebrate: boolean; t: Messages }) {
  const [atEdge, setAtEdge] = useState(!celebrate);
  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setAtEdge(true), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [celebrate]);

  return (
    <div
      className="pointer-events-none absolute left-1/2 z-10 transition-[top,translate,scale] duration-500 ease-out"
      style={{ top: atEdge ? 0 : "50%", translate: atEdge ? "-50% -75%" : "-50% -50%", scale: atEdge ? 0.6 : 1 }}
    >
      <p
        className={`${celebrate ? "animate-pop-in" : ""} -rotate-6 rounded-3xl border-4 border-ink px-6 py-2 font-black tracking-wider whitespace-nowrap shadow-[0_6px_0_0_var(--color-ink)] ${
          result === "bingo" ? "bg-cf-yellow text-5xl text-ink" : "bg-white text-3xl text-ink/80"
        }`}
      >
        {result === "bingo" ? `🎉 ${t.bingo}` : `🏳️ ${t.gaveUp}`}
      </p>
    </div>
  );
}

function FinishedCard({ game, onNewCard, t }: { game: BingoGame; onNewCard: () => void; t: Messages }) {
  const items = game.cells.filter((cell) => cell.itemId !== null);
  const opened = items.filter(isOpen).length;
  const time = formatDuration((game.finishedAt ?? Date.now()) - game.startedAt);
  return (
    <div className="card-pop space-y-4 p-5 text-center">
      <p className="font-black">
        {game.result === "bingo" ? t.bingoNote(time, game.shots) : t.gaveUpNote(opened, items.length)}
      </p>
      <button type="button" className="btn-pop min-w-60" onClick={onNewCard}>
        {t.newCard}
      </button>
    </div>
  );
}

function JudgeDetails({ judge, theme, t }: { judge: BingoJudgeResponse; theme: BingoTheme; t: Messages }) {
  const { lang } = useLang();
  const rows = Object.entries(judge.probabilities)
    .map(([id, probability]) => ({ item: findItem(theme, id), probability }))
    .filter((row): row is { item: BingoItem; probability: number } => row.item !== undefined)
    .sort((a, b) => b.probability - a.probability);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-black">{t.judgment}</h3>
        <p className="text-xs font-bold text-ink/60">
          {judge.model} · {judge.latencyMs}ms
        </p>
      </div>
      <ul className="space-y-2">
        <ProbabilityRow label={`📷 ${t.real}`} probability={judge.realProbability} isChosen={judge.isReal} />
        <li className="border-t-2 border-dashed border-ink/20" />
        {rows.map(({ item, probability }) => (
          <ProbabilityRow
            key={item.id}
            label={`${item.emoji} ${item.label[lang]}`}
            probability={probability}
            isChosen={judge.found.includes(item.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function ProbabilityRow({ label, probability, isChosen }: { label: string; probability: number; isChosen: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className="w-32 shrink-0 truncate text-xs font-extrabold">{label}</span>
      <span className="relative h-5 flex-1 overflow-hidden rounded-full border-2 border-ink bg-cf-cream">
        <span
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${
            isChosen ? "bg-cf-orange" : "bg-cf-yellow/60"
          }`}
          style={{ width: `${probability * 100}%` }}
        />
      </span>
      <span className="w-10 shrink-0 text-right text-xs font-black tabular-nums">{Math.round(probability * 100)}%</span>
    </li>
  );
}
