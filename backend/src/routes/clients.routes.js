import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Client from "../models/Client.js";

const router = express.Router();

// protect all endpoints below
router.use(requireAuth);

// GET /api/clients
router.get("/", async (req, res) => {
  const q = req.query.q?.trim();
  const filter = { userId: req.userId };
  if (q) filter.name = new RegExp(q, "i");

  const clients = await Client.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json(clients);
});

// POST /api/clients
router.post("/", async (req, res) => {
  const body = req.body;
  const client = await Client.create({
    ...body,
    userId: req.userId,
    emailLower: body.email?.toLowerCase(),
  });
  res.status(201).json(client);
});

// GET /api/clients/:id
router.get("/:id", async (req, res) => {
  const doc = await Client.findOne({ _id: req.params.id, userId: req.userId });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

// PUT /api/clients/:id
router.put("/:id", async (req, res) => {
  const updated = await Client.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

// DELETE /api/clients/:id
router.delete("/:id", async (req, res) => {
  const deleted = await Client.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;
