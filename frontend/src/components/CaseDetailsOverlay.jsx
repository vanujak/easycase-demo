import { useEffect, useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function CaseDetailOverlay({ caseId, onClose }) {
  const token = localStorage.getItem("token");
  const [caseDoc, setCaseDoc] = useState(null);
  const [hearings, setHearings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openHearing, setOpenHearing] = useState(false);
  const [error, setError] = useState("");

  const isClosed = caseDoc?.status === "closed";

  async function fetchAll() {
    setLoading(true);
    setError("");
    try {
      const [cRes, hRes] = await Promise.all([
        fetch(`${API}/api/cases/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/hearings?caseId=${caseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const c = await cRes.json();
      const h = await hRes.json();
      if (!cRes.ok) throw new Error(c?.error || "Failed to load case");
      if (!hRes.ok) throw new Error(h?.error || "Failed to load hearings");
      setCaseDoc(c);
      setHearings(
        (Array.isArray(h) ? h : []).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const nextHearingLabel = useMemo(() => {
    // take the hearing with the latest (max) date that has a nextDate
    const withNext = (hearings || []).filter(h => h.nextDate);
    if (!withNext.length) return null;

    const latest = withNext.reduce((a, b) =>
      new Date(a.date) > new Date(b.date) ? a : b
    );
    return new Date(latest.nextDate).toLocaleDateString();
  }, [hearings]);
  

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-white/90 px-4 py-3 backdrop-blur relative">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-2 top-2 rounded-md border px-3 py-2 hover:bg-gray-50"
          >
            ✕
          </button>

          {/* Add hearing */}
          <div className="absolute left-2 top-2">
            <button
              disabled={isClosed}
              onClick={() => setOpenHearing(true)}
              className={`rounded-lg px-4 py-2 font-semibold ${
                isClosed
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              title={
                isClosed
                  ? "Case is closed. Hearings cannot be added."
                  : "Add hearing"
              }
            >
              + Add hearing
            </button>
          </div>

          {/* Centered case info */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold">
              {loading ? "Loading…" : caseDoc?.title}
            </h2>
            {!loading && caseDoc && (
              <p className="text-sm text-gray-500">
                {caseDoc.clientName ? `${caseDoc.clientName} • ` : ""}
                {caseDoc.courtType}
                {caseDoc.courtPlace ? ` — ${caseDoc.courtPlace}` : ""}
                {caseDoc.number ? ` • #${caseDoc.number}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
          {!loading && nextHearingLabel && (
            <div className="mt-4 flex justify-center">
              <div className="rounded-full border bg-white px-4 py-1 text-sm shadow">
                Next hearing:{" "}
                <span className="font-medium">{nextHearingLabel}</span>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-red-600">{error}</p>}
          {loading ? (
            <div className="mt-10">Loading timeline…</div>
          ) : (
            <Timeline startedAt={caseDoc.createdAt} hearings={hearings} />
          )}
        </div>
      </div>

      {/* Hearing Modal */}
      {openHearing && (
        <HearingModal
          caseId={caseId}
          onClose={() => setOpenHearing(false)}
          onSaved={() => {
            setOpenHearing(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

/* ----------------------------- Timeline ----------------------------- */
function Timeline({ startedAt, hearings }) {
  // Build items (newest first; “Case started” last at the bottom)
  const items = [
    ...(hearings || [])
  .slice()
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map((h, i) => {
    const isLatest = i === 0;              // newest card only
    const hasNext  = Boolean(h.nextDate);
    const title    = isLatest && hasNext
      ? `Next hearing: ${new Date(h.nextDate).toLocaleDateString()}`
      : new Date(h.date).toLocaleDateString();

    // Only show nextDate in the footer for the latest card
    const footerBits = [
      h.outcome ? `Outcome: ${h.outcome}` : null,
    ].filter(Boolean);

    return {
      key: h._id || `h-${i}`,
      side: i % 2 === 0 ? "left" : "right",
      title,
      subtitle: h.venue || null,
      body: h.notes || "",
      footer: footerBits.length ? footerBits.join("  •  ") : null,
    };
  }),
    {
      key: "start",
      side: (hearings?.length ?? 0) % 2 === 0 ? "left" : "right",
      isStart: true,
      title: "Case started",
      subtitle: new Date(startedAt).toLocaleDateString(),
      body: "— Beginning of the case —",
      footer: null,
    },
  ];

  // Measure dots and clamp the line between the first and last dot
  const wrapRef = useRef(null);
  const [linePos, setLinePos] = useState({ top: 0, bottom: 0 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const dots = Array.from(wrap.querySelectorAll("[data-dot='1']"));
    if (!dots.length) return;

    const wrapBox = wrap.getBoundingClientRect();

    // First and last dot (in visual order)
    const first = dots[0].getBoundingClientRect();
    const last = dots[dots.length - 1].getBoundingClientRect();

    // Center of the dots relative to container
    const firstY = first.top - wrapBox.top + first.height / 2;
    const lastY = last.top - wrapBox.top + last.height / 2;

    setLinePos({ top: firstY, bottom: wrapBox.height - lastY });
  }, [items.length]);

  return (
    <section className="relative mx-auto mt-8 max-w-5xl" ref={wrapRef}>
      <ul className="relative grid grid-cols-[1fr_40px_1fr] gap-x-6">
        {/* Vertical line clamped between the first & last dot */}
        <div
          className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-gray-300"
          style={{ top: `${linePos.top}px`, bottom: `${linePos.bottom}px` }}
        />
        {items.map((it) => (
          <TimelineRow key={it.key} item={it} />
        ))}
      </ul>
    </section>
  );
}

function TimelineRow({ item }) {
  const card = (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {item.subtitle && (
        <div className="text-sm text-gray-600">{item.subtitle}</div>
      )}
      <h3 className="text-base font-semibold">{item.title}</h3>
      {item.body && <p className="mt-2 whitespace-pre-wrap">{item.body}</p>}
      {item.footer && <p className="mt-2 text-sm text-gray-600">{item.footer}</p>}
    </div>
  );

  return (
    <>
      <div className="col-start-1 mb-12">
        {item.side === "left" ? card : <div className="hidden md:block" />}
      </div>
      <div className="relative col-start-2 mb-12 flex items-center justify-center">
        <span
          data-dot="1"
          className="block h-3 w-3 rounded-full bg-black"
        />
      </div>
      <div className="col-start-3 mb-12">
        {item.side === "right" ? card : <div className="hidden md:block" />}
      </div>
    </>
  );
}

/* --------------------------- Hearing Modal --------------------------- */
function HearingModal({ caseId, onClose, onSaved }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    date: "",        // YYYY-MM-DD
    notes: "",
    outcome: "Adjourned",
    nextDate: "",    // YYYY-MM-DD
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const OUTCOMES = ["Adjourned", "Continued", "Judgment", "Settled", "Other"];

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toIsoDateOnly = (yyyyMmDd) => {
    // Convert a 'YYYY-MM-DD' to ISO at local midnight
    if (!yyyyMmDd) return undefined;
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    return dt.toISOString();
  };

  const validate = () => {
    if (!form.date) return "Please select the hearing date.";
    if (!form.outcome) return "Please select an outcome.";
    if (!form.nextDate) return "Please select the next hearing date.";
    // Ensure next hearing date is not before the hearing date
    const d1 = new Date(form.date);
    const d2 = new Date(form.nextDate);
    if (d2 < d1) return "Next hearing date cannot be earlier than the hearing date.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setSaving(true);
    setErr("");

    try {
      const payload = {
        caseId,
        date: toIsoDateOnly(form.date),
        notes: form.notes?.trim() || undefined,
        outcome: form.outcome,
        nextDate: toIsoDateOnly(form.nextDate), // <-- Requires backend support in Hearing model & route
      };

      const res = await fetch(`${API}/api/hearings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create hearing");

      onSaved?.();  // refresh parent
      onClose();    // close modal
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const notesMax = 1000;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add hearing</h2>
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        {err && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </p>
        )}

        <form onSubmit={submit} className="mt-4 grid gap-4">
          {/* Date (required) */}
          <div>
            <label className="block text-sm mb-1">
              Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          {/* Notes (optional) */}
          <div>
            <label className="block text-sm mb-1">
              What happened? <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => {
                const v = e.target.value.slice(0, notesMax);
                setForm((f) => ({ ...f, notes: v }));
              }}
              rows={4}
              placeholder="Notes / summary of the hearing"
              className="w-full rounded-lg border px-3 py-2"
            />
            <div className="mt-1 text-xs text-gray-500">
              {form.notes.length}/{notesMax}
            </div>
          </div>

          {/* Outcome (required) */}
          <div>
            <label className="block text-sm mb-1">
              Outcome <span className="text-red-600">*</span>
            </label>
            <select
              name="outcome"
              value={form.outcome}
              onChange={onChange}
              required
              className="w-full rounded-lg border px-3 py-2 bg-white"
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Next hearing date (required) */}
          <div>
            <label className="block text-sm mb-1">
              Next hearing date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="nextDate"
              value={form.nextDate}
              onChange={onChange}
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save hearing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

