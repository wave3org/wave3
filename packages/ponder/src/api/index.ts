import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { graphql } from "ponder";

const app = new Hono();

app.use("/graphql", graphql({ db, schema }));

app.get("/ping", (c) => {
  return c.json({ status: "ok", service: "ponder", message: "Service is awake" });
});

export default app;

