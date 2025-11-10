// backend/src/routes/cases.routes.js
import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Case from "../models/Case.js";
import Client from "../models/Client.js";
const router = express.Router();

// All routes require auth (populates req.userId)
router.use(requireAuth);
router.patch("/:id/close", async (req, res) => {
  try {
    const updated = await Case.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: "closed" },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
  });

/**
 * GET /api/cases
 * Optional query: ?q= (search title/number), ?courtType=..., ?courtPlace=...
 */
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = { userId: req.userId };

    if (q) {
      // allow "#123", "123", and title regex
      const cleaned = q.replace(/^#/, "").trim();
      const maybeNum = Number(cleaned);

      const or = [{ title: new RegExp(q, "i") }];

      // exact numeric match when q parses as a number
      if (!Number.isNaN(maybeNum)) {
        or.push({
           $expr: { $regexMatch: { input: { $toString: "$number" }, regex: cleaned } }
        });
      }

      filter.$or = or;
    }
    if (req.query.courtType)  filter.courtType  = req.query.courtType;
    if (req.query.courtPlace) filter.courtPlace = req.query.courtPlace;

    // Fetch cases, join client name
    const docs = await Case.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "clientId", select: "name", options: { lean: true } })
      .lean();

    const items = docs.map(d => ({
      ...d,
      clientName: d.clientId?.name || null,
      clientId:   d.clientId?._id || d.clientId,
    }));

    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/cases/next-number
 * Returns the next incremental number for the current user.
 * Make sure this route is ABOVE `/:id`.
 */
router.get("/next-number", async (req, res) => {
  try {
    const last = await Case.findOne({ userId: req.userId })
      .sort({ number: -1 })
      .select("number")
      .lean();
    const next = last ? last.number + 1 : 1;
    res.json({ next });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const { title, clientId, type, courtType, courtPlace } = body;
    const status ="open";

    if (!title)    return res.status(400).json({ error: "title is required" });
    if (!clientId) return res.status(400).json({ error: "clientId is required" });

    // ensure client belongs to this user
    const client = await Client.findOne({ _id: clientId, userId: req.userId })
      .select("_id")
      .lean();
    if (!client) return res.status(400).json({ error: "Invalid clientId" });

    // compute next number per user
    const last = await Case.findOne({ userId: req.userId })
      .sort({ number: -1 })
      .select("number")
      .lean();
    const nextNumber = last ? last.number + 1 : 1;

    // create the case
    const doc = await Case.create({
      userId: req.userId,
      title,
      clientId,
      type,
      courtType,
      courtPlace,
      status,
      number: nextNumber,
    });

    return res.status(201).json(doc);
  } catch (e) {
    // handle rare race condition on unique (userId, number)
    if (e.code === 11000) {
      try {
        const last2 = await Case.findOne({ userId: req.userId })
          .sort({ number: -1 })
          .select("number")
          .lean();
        const next2 = last2 ? last2.number + 1 : 1;

        const doc2 = await Case.create({
          ...req.body,
          userId: req.userId,
          number: next2,
        });
        return res.status(201).json(doc2);
      } catch (e2) {
        console.error(e2);
      }
    }
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//GET /api/cases/:id

router.get("/:id", async (req, res) => {
  try {
    const doc = await Case.findOne({ _id: req.params.id, userId: req.userId })
      .populate({ path: "clientId", select: "name", options: { lean: true } })
      .lean();

    if (!doc) return res.status(404).json({ error: "Not found" });

    res.json({
      ...doc,
      clientName: doc.clientId?.name || null,
      clientId:   doc.clientId?._id || doc.clientId,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/cases/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const update = { ...req.body };

    if (update.clientId) {
      const ok = await Client.exists({ _id: update.clientId, userId: req.userId });
      if (!ok) return res.status(400).json({ error: "Invalid clientId" });
    }

    const updated = await Case.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/cases/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Case.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
