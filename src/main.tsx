import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import "./index.css";
import { AvatarPage } from "./pages/avatar/AvatarPage";
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
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
