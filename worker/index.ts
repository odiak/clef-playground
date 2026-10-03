import { Hono } from "hono";
import { janken } from "./routes/janken";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/janken", janken);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
