import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { graphql } from "ponder";

import songs from "./routes/songs";
import albums from "./routes/albums";
import plays from "./routes/plays";
import marketplace from "./routes/marketplace";
import portfolio from "./routes/portfolio";
import boosts from "./routes/boosts";

const app = new Hono();

app.use("/*", cors());
app.use("/graphql", graphql({ db, schema }));

/** Health check. Returns { status, service, message }. */
app.get("/ping", (c) => {
  return c.json({ status: "ok", service: "ponder", message: "Service is awake" });
});

app.route("/", songs);
app.route("/", albums);
app.route("/", plays);
app.route("/", marketplace);
app.route("/", portfolio);
app.route("/", boosts);

export default app;
