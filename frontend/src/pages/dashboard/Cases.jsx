import { useEffect, useMemo, useState } from "react";
import NavbarDashboard from "../../components/NavbarDashboard.jsx";
import { SRI_LANKA_DISTRICTS, SRI_LANKA_PROVINCES } from "../../constants/geo.js";
import { COURT_TYPES, CASE_STATUSES } from "../../constants/courts.js";
import CaseDetailsOverlay from "../../components/CaseDetailsOverlay.jsx";

const API = import.meta.env.VITE_API_URL;

const CLIENT_TYPES = [
  "individual",
  "company",
  "government",
  "organization",
];

function normalizeSriLankaPhone(input = "") {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("94")) return `+${digits}`;
  if (digits.startsWith("0"))   return `+94${digits.slice(1)}`;
  if (digits.startsWith("+94")) return `+94${digits.slice(3)}`;
  return `+94${digits}`;
}

export default function Cases() {
  const token = localStorage.getItem("token");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const [openCaseModal, setOpenCaseModal] = useState(false);
  const [openCaseId, setOpenCaseId] = useState(null); // selected case (details drawer)
  // Prevent background scroll when overlay is open
    useEffect(() => {
        if (openCaseId) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
            document.body.style.overflow = prev;
            };
        }
        }, [openCaseId]);
  const closeCase = async (id) => {
    if (!confirm("Close this case? You won’t be able to add new hearings.")) return;
    const res = await fetch(`${API}/api/cases/${id}/close`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Failed to close case");
    fetchCases(q); // refresh list
  };

  const deleteCase = async (id) => {
    if (!confirm("Delete this case permanently? This cannot be undone.")) return;
    const res = await fetch(`${API}/api/cases/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.error || "Failed to delete case");
    fetchCases(q); // refresh list
  };


  const fetchCases = async (query = "") => {
    setLoading(true); setError("");
    try {
      const url = `${API}/api/cases${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load cases");
      setCases(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); /* eslint-disable-next-line */ }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <NavbarDashboard />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Cases</h1>
          <div className="flex gap-2">
            <form
              onSubmit={(e) => { e.preventDefault(); fetchCases(q.trim()); }}
              className="flex gap-2"
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by title/number"
                className="rounded-lg border px-3 py-2"
              />
              <button className="rounded-lg bg-black px-4 py-2 text-white font-semibold">
                Search
              </button>
            </form>
            <button
              onClick={() => setOpenCaseModal(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold shadow hover:bg-blue-700"
            >
              + New case
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Court</th>
                <th className="px-4 py-3">Place</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-4 py-6" colSpan={6}>Loading…</td></tr>
              ) : cases.length === 0 ? (
                <tr><td className="px-4 py-10 text-center text-gray-500" colSpan={6}>No cases yet.</td></tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c._id}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => setOpenCaseId(c._id)}
                    >
                    <td className="px-4 py-3 text-gray-600">#{c.number}</td> 
                    <td className="px-4 py-3 font-medium">{c.title}</td>
                    <td className="px-4 py-3">{c.clientName || "—"}</td>
                    <td className="px-4 py-3">{c.courtType}</td>
                    <td className="px-4 py-3">{c.courtPlace || "—"}</td>
                    <td className="px-4 py-3 capitalize">{c.status}</td>
                    <td className="px-4 py-3">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); closeCase(c._id); }}
                          className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
                          disabled={c.status === "closed"}
                          title={c.status === "closed" ? "Already closed" : "Close case"}
                        >
                          Close
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCase(c._id); }}
                          className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openCaseId && (
        <CaseDetailsOverlay
          caseId={openCaseId}
          onClose={() => setOpenCaseId(null)}
        />
      )}
      {openCaseModal && (
      <CaseModal
        onClose={() => setOpenCaseModal(false)}
        onSaved={() => {
          setOpenCaseModal(false);
          fetchCases();     // refresh list after creating a case
        }}
      />
    )}
    </main>
  );
}

/* ----------------------------- CaseModal ----------------------------- */
function CaseModal({ onClose, onSaved }) {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    type: "",               // custom type (free text if you like)
    clientId: "",
    courtType: COURT_TYPES[0],
    courtPlace: "",
    status: "open",
  });
  const [nextNumber, setNextNumber] = useState(null);

useEffect(() => {
  let isMounted = true;
  (async () => {
    try {
      const res = await fetch(`${API}/api/cases/next-number`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (isMounted) setNextNumber(data?.next ?? null);
    } catch {
      if (isMounted) setNextNumber(null);
    }
  })();
  return () => { isMounted = false; };
}, []);

  // client search (async)
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // toggle "add new client here"
  const [addClient, setAddClient] = useState(false);

  // new client form (all fields your API/schema expects)
  const [newClient, setNewClient] = useState({
    type: "individual",
    name: "",
    email: "",
    phone: "",
    address: "",
    district: "", // must be one of SRI_LANKA_DISTRICTS
  });

  const canPickDistrict = useMemo(
    () => form.courtType === "District Court" || form.courtType === "High Court",
    [form.courtType]
  );
  const canPickProvince = useMemo(
    () => form.courtType === "Provincial High Court",
    [form.courtType]
  );
  const fixedColombo = useMemo(
    () => form.courtType === "Court of Appeal" || form.courtType === "Supreme Court",
    [form.courtType]
  );

  useEffect(() => {
    // adjust courtPlace when courtType changes
    if (fixedColombo) {
      setForm((f) => ({ ...f, courtPlace: "Colombo" }));
    } else {
      setForm((f) => ({ ...f, courtPlace: "" }));
    }
  }, [fixedColombo]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // search clients by name
  const searchClients = async (q) => {
    setSearching(true);
    try {
      const res = await fetch(`${API}/api/clients?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClientResults(Array.isArray(data) ? data : []);
    } catch {
      setClientResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      if (clientQuery.trim()) searchClients(clientQuery.trim());
      else setClientResults([]);
    }, 300);
    return () => clearTimeout(id);
  }, [clientQuery]);

  const createClientInline = async () => {
  // never send empty strings for enum fields
  const payload = {
    ...newClient,
    phone: newClient.phone ? normalizeSriLankaPhone(newClient.phone) : undefined,
  };

  // remove "" and undefined so Mongoose doesn’t validate empty enum values
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== "" && v != null)
  );

  const res = await fetch(`${API}/api/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(clean),
  });
  const data = await res.json();

  if (!res.ok) {
    alert(data?.error || "Failed to create client");
    return;
  }

  // Select the freshly created client
  setForm((f) => ({ ...f, clientId: data._id }));
  setClientQuery(data.name);
  setClientResults([data]);
  setAddClient(false);
};

  const submitCase = async (e) => {
    e.preventDefault();
      if (!form.clientId) {
    alert("Please pick or add a client first.");
    return;
  }

    // payload — keep it clean
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "")
    );

    const res = await fetch(`${API}/api/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to create case");

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">New case</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">✕</button>
        </div>

<form onSubmit={submitCase} className="mt-4">
  {/* Scroll only when addClient is open */}
  <div className={`grid gap-4 ${addClient ? "max-h-[70vh] overflow-y-auto pr-2" : ""}`}>
    {/* Title + Case number */}
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm mb-1">Title</label>
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Case number</label>
        <input value={`#${nextNumber || "…"}`} readOnly
          className="w-full rounded-lg border px-3 py-2 bg-gray-100" />
        <p className="mt-1 text-xs text-gray-500">
          Assigned automatically when you create the case.
        </p>
      </div>
    </div>

    {/* Type of case */}
    <div>
      <label className="block text-sm mb-1">Type of case</label>
      <input
        name="type"
        value={form.type}
        onChange={onChange}
        placeholder="e.g., Property dispute"
        className="w-full rounded-lg border px-3 py-2"
      />
    </div>

    {/* Client section */}
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Client</label>
        <button
          type="button"
          onClick={() => setAddClient(v => !v)}
          className="text-sm underline"
        >
          {addClient ? "Pick existing instead" : "Add new client here"}
        </button>
      </div>

      {!addClient ? (
        // --- Pick existing client ---
        <div className="mt-2">
          <input
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
            placeholder="Search client by name…"
            className="w-full rounded-lg border px-3 py-2"
          />
          {searching && <p className="text-xs mt-1">Searching…</p>}
          {clientResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-auto rounded-lg border">
              {clientResults.map((c) => (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => {
                    setForm((f) => ({ ...f, clientId: c._id }));
                    setClientQuery(c.name);
                    setClientResults([]);
                  }}
                  className={`block w-full text-left px-3 py-2 hover:bg-gray-50 ${
                    form.clientId === c._id ? "bg-blue-50" : ""
                  }`}
                >
                  {c.name} <span className="text-gray-500 text-xs">
                    ({c.email || "no email"})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // --- Add new client inline (scrolling allowed) ---
        <div className="mt-2 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Type</label>
              <select
                value={newClient.type}
                onChange={(e) => setNewClient(v => ({ ...v, type: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 bg-white"
                required
              >
                {CLIENT_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                placeholder="Full name / Organization"
                value={newClient.name}
                onChange={(e) => setNewClient(v => ({ ...v, name: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={newClient.email}
                onChange={(e) => setNewClient(v => ({ ...v, email: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                placeholder="+9477xxxxxxx"
                value={newClient.phone}
                onChange={(e) => setNewClient(v => ({ ...v, phone: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Address</label>
            <input
              placeholder="Street, city"
              value={newClient.address}
              onChange={(e) => setNewClient(v => ({ ...v, address: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">District</label>
            <select
              value={newClient.district}
              onChange={(e) => setNewClient(v => ({ ...v, district: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 bg-white"
              required
            >
              <option value="" disabled>Select district</option>
              {SRI_LANKA_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="mt-1">
            <button
              type="button"
              onClick={createClientInline}
              className="w-full md:w-auto rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold"
            >
              Save client
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Court / Place */}
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm mb-1">Court</label>
        <select
          name="courtType"
          value={form.courtType}
          onChange={onChange}
          className="w-full rounded-lg border px-3 py-2 bg-white"
          required
        >
          {COURT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Place</label>
        {fixedColombo ? (
          <input value="Colombo" readOnly className="w-full rounded-lg border px-3 py-2 bg-gray-100" />
        ) : canPickDistrict ? (
          <select
            name="courtPlace"
            value={form.courtPlace}
            onChange={onChange}
            required
            className="w-full rounded-lg border px-3 py-2 bg-white"
          >
            <option value="" disabled>Select district</option>
            {SRI_LANKA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        ) : canPickProvince ? (
          <select
            name="courtPlace"
            value={form.courtPlace}
            onChange={onChange}
            required
            className="w-full rounded-lg border px-3 py-2 bg-white"
          >
            <option value="" disabled>Select province</option>
            {SRI_LANKA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        ) : (
          <input readOnly className="w-full rounded-lg border px-3 py-2 bg-gray-100" />
        )}
      </div>
    </div>

    {/* Status (display only) */}
    <div>
      <label className="block text-sm mb-1">Status</label>
      <input
        value="open"
        readOnly
        className="w-full rounded-lg border px-3 py-2 bg-gray-100 lowercase"
        style={{ textTransform: "capitalize" }}
      />
      <p className="mt-1 text-xs text-gray-500">
        Cases always start as open. You can close the case from the table.
      </p>
    </div>
  </div>

  {/* Footer buttons (always visible) */}
  <div className="mt-4 flex justify-end gap-2">
    <button type="button" onClick={onClose}
            className="rounded-lg border px-4 py-2 hover:bg-gray-50">
      Cancel
    </button>
    <button type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold">
      Create case
    </button>
  </div>
</form>
      </div>
    </div>
  );
}

/* ----------------------------- CaseDrawer ----------------------------- */
// {openCaseId && (
//   <CaseDetailOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />
// )}
/* ----------------------------- HearingModal ----------------------------- */
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

        <p className="mt-3 text-xs text-gray-500">
          <strong>Note:</strong> The payload now includes <code>nextDate</code>. Make sure your
          Hearing schema & <code>POST /api/hearings</code> route accept it, e.g.:
          <code> nextDate: {'{'} type: Date {'}'} </code>.
        </p>
      </div>
    </div>
  );
}
