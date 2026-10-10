import { Hono } from "hono";
import type { ErrorResponse } from "../shared/api";
import { PAGES, renderPage } from "./pages";
import { avatar } from "./routes/avatar";
import { bingo } from "./routes/bingo";
import { draw } from "./routes/draw";
import { janken } from "./routes/janken";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/janken", janken);
app.route("/api/avatar", avatar);
app.route("/api/bingo", bingo);
app.route("/api/draw", draw);

for (const [path, meta] of Object.entries(PAGES)) {
  app.get(path, (c) => renderPage(c, meta));
}

app.notFound((c) => c.json<ErrorResponse>({ error: "not_found" }, 404));

export default app;
