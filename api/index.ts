import { fastify } from "fastify";
import cors from "@fastify/cors";
import fs from "fs/promises"; // para ler/escrever db.json
import path from "path";

const app = fastify();

app.register(cors, {
  origin: "*",
});

const dbPath = path.resolve("db.json");

// Utilidade para ler o arquivo
const readDB = async () => {
  const data = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(data);
};

// Utilidade para salvar o arquivo
const writeDB = async (data) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

// GET /items
app.get("/items", async () => {
  const db = await readDB();
  return db.items || [];
});

// POST /items
app.post("/items", async (request, reply) => {
  const db = await readDB();
  const newItem = request.body;

  newItem.id = Date.now();
  db.items.push(newItem);

  await writeDB(db);
  reply.code(201).send(newItem);
});

// PUT /items/:id
app.put("/items/:id", async (request, reply) => {
  const db = await readDB();
  const { id } = request.params;
  const updatedItem = request.body;

  const index = db.items.findIndex((item) => item.id == id);
  if (index === -1) {
    return reply.code(404).send({ message: "Item not found" });
  }

  db.items[index] = { ...db.items[index], ...updatedItem };
  await writeDB(db);

  reply.send(db.items[index]);
});

// DELETE /items/:id
app.delete("/items/:id", async (request, reply) => {
  const db = await readDB();
  const { id } = request.params;

  const index = db.items.findIndex((item) => item.id == id);
  if (index === -1) {
    return reply.code(404).send({ message: "Item not found" });
  }

  db.items.splice(index, 1);
  await writeDB(db);

  reply.send({ message: "Item deleted" });
});

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running!");
});