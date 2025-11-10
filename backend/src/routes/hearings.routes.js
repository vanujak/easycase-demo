import express from "express";
import mongoose from "mongoose";
import Hearing, { OUTCOMES } from "../models/Hearing.js";
import Case from "../models/Case.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

/** Convert 'YYYY-MM-DD' to a Date at local midnight. Accepts ISO too. */
function toDateOrNull(value) {
  if (!value) return null;
  // If it's already ISO, try native parse
  if (typeof value === "string" && value.includes("T")) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
    }
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [_, y, mo, d] = m.map(Number);
  const dt = new Date(y, mo - 1, d, 0, 0, 0, 0);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * POST /api/hearings
 * Body: { caseId(ObjectId), date(YYYY-MM-DD or ISO), notes?, outcome(one of OUTCOMES), nextDate(YYYY-MM-DD or ISO)? }
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId, date, notes, outcome, nextDate } = req.body;

    if (!mongoose.isValidObjectId(caseId)) {
      return res.status(400).json({ error: "Invalid caseId" });
    }

    // Ensure the case belongs to this user
    const parent = await Case.findOne({ _id: caseId, userId }).select("_id").lean();
    if (!parent) return res.status(404).json({ error: "Case not found" });

    const dateObj = toDateOrNull(date);
    if (!dateObj) return res.status(400).json({ error: "Invalid hearing date" });

    if (!OUTCOMES.includes(outcome)) {
      return res.status(400).json({ error: "Invalid outcome" });
    }

    let nextDateObj = undefined;
    if (typeof nextDate !== "undefined" && nextDate !== null && nextDate !== "") {
      nextDateObj = toDateOrNull(nextDate);
      if (!nextDateObj) return res.status(400).json({ error: "Invalid nextDate" });
      if (nextDateObj.getTime() < dateObj.getTime()) {
        return res.status(400).json({ error: "nextDate cannot be earlier than date" });
      }
    }

    const created = await Hearing.create({
      userId,
      caseId: parent._id,
      date: dateObj,
      notes: notes?.trim() || undefined,
      outcome,
      nextDate: nextDateObj,
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("POST /api/hearings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/hearings?caseId=<mongoId>  or  ?caseNumber=<int>
 * Lists hearings for a case (owned by current user). Sorted oldest→newest.
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { caseId, caseNumber } = req.query;

    const q = { userId };

    if (caseId) {
      if (!mongoose.isValidObjectId(caseId)) {
        return res.status(400).json({ error: "Invalid caseId" });
      }
      q.caseId = caseId;
    } else if (caseNumber) {
      const parent = await Case.findOne({ userId, number: Number(caseNumber) })
        .select("_id").lean();
      if (!parent) return res.json([]); // no such case for this user
      q.caseId = parent._id;
    } else {
      return res.status(400).json({ error: "caseId or caseNumber is required" });
    }

    const items = await Hearing.find(q).sort({ date: 1, createdAt: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error("GET /api/hearings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * OPTIONAL: PATCH /api/hearings/:id
 */
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid hearing id" });
    }

    const update = {};
    const { date, notes, outcome, nextDate } = req.body;

    if (typeof notes === "string") update.notes = notes;
    if (typeof outcome !== "undefined") {
      if (!OUTCOMES.includes(outcome)) {
        return res.status(400).json({ error: "Invalid outcome" });
      }
      update.outcome = outcome;
    }
    if (typeof date !== "undefined") {
      const d = toDateOrNull(date);
      if (!d) return res.status(400).json({ error: "Invalid date" });
      update.date = d;
    }
    if (typeof nextDate !== "undefined") {
      if (nextDate === null || nextDate === "") {
        update.nextDate = undefined; // will unset below
      } else {
        const nd = toDateOrNull(nextDate);
        if (!nd) return res.status(400).json({ error: "Invalid nextDate" });
        update.nextDate = nd;
      }
    }

    // Validate nextDate >= date
    const current = await Hearing.findOne({ _id: req.params.id, userId }).lean();
    if (!current) return res.status(404).json({ error: "Not found" });

    const newDate = update.date ?? current.date;
    const newNext = update.hasOwnProperty("nextDate") ? update.nextDate : current.nextDate;
    if (newNext && newDate && newNext.getTime() < newDate.getTime()) {
      return res.status(400).json({ error: "nextDate cannot be earlier than date" });
    }

    const updated = await Hearing.findOneAndUpdate(
      { _id: req.params.id, userId },
      { ...update, ...(update.nextDate === undefined ? { $unset: { nextDate: "" } } : {}) },
      { new: true }
    ).lean();

    res.json(updated);
  } catch (err) {
    console.error("PATCH /api/hearings/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * OPTIONAL: DELETE /api/hearings/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.userId;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid hearing id" });
    }
    const del = await Hearing.findOneAndDelete({ _id: req.params.id, userId }).lean();
    if (!del) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/hearings/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
