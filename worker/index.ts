import { Hono } from "hono";
import { PAGES, renderPage } from "./pages";
import { janken } from "./routes/janken";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/janken", janken);

for (const [path, meta] of Object.entries(PAGES)) {
  app.get(path, (c) => renderPage(c, meta));
}

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
