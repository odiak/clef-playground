import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import "./index.css";
import { AvatarPage } from "./pages/avatar/AvatarPage";
import { GalleryPage } from "./pages/avatar/GalleryPage";
import { HomePage } from "./pages/HomePage";
import { JankenPage } from "./pages/janken/JankenPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="janken" element={<JankenPage />} />
          <Route path="avatar" element={<AvatarPage />} />
          {/* 開発用: アバターの見た目をまとめて確認するページ */}
          {import.meta.env.DEV && <Route path="avatar/gallery" element={<GalleryPage />} />}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
