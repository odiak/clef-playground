import { Hono } from "hono";
import type { ErrorResponse } from "../shared/api";
import { PAGES, renderPage } from "./pages";
import { avatar } from "./routes/avatar";
import { janken } from "./routes/janken";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/janken", janken);
app.route("/api/avatar", avatar);

for (const [path, meta] of Object.entries(PAGES)) {
  app.get(path, (c) => renderPage(c, meta));
}

app.notFound((c) => c.json<ErrorResponse>({ error: "not_found" }, 404));

export default app;
