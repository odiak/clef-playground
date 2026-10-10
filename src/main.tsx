import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import "./index.css";
import { LangProvider } from "./lib/i18n";
import { AvatarPage } from "./pages/avatar/AvatarPage";
import { GalleryPage } from "./pages/avatar/GalleryPage";
import { BingoPage } from "./pages/bingo/BingoPage";
import { DrawPage } from "./pages/draw/DrawPage";
import { HomePage } from "./pages/HomePage";
import { JankenPage } from "./pages/janken/JankenPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="janken" element={<JankenPage />} />
            <Route path="avatar" element={<AvatarPage />} />
            <Route path="bingo" element={<BingoPage />} />
            <Route path="draw" element={<DrawPage />} />
            {/* 開発用: アバターの見た目をまとめて確認するページ */}
            {import.meta.env.DEV && <Route path="avatar/gallery" element={<GalleryPage />} />}
          </Route>
        </Routes>
      </BrowserRouter>
    </LangProvider>
  </StrictMode>,
);
