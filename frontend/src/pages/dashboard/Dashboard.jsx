// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import NavbarDashboard from "../../components/NavbarDashboard.jsx";
import CaseDetailsOverlay from "../../components/CaseDetailsOverlay.jsx";

const API = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const token = localStorage.getItem("token");

  // header
  const [userName, setUserName] = useState("");

  // tiles / lists
  const [activeCases, setActiveCases] = useState(0);
  const [upcomingHearings, setUpcomingHearings] = useState([]);

  // ui state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [openCaseId, setOpenCaseId] = useState(null);

  // lock scroll when drawer is open (same pattern as Cases page)
  useEffect(() => {
    if (!openCaseId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [openCaseId]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");

      try {
        // 1) profile
        try {
          const meRes = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const me = await meRes.json();
          if (meRes.ok && me?.name) setUserName(me.name);
        } catch {
          /* ignore name failure */
        }

        // 2) cases
        const cRes = await fetch(`${API}/api/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cases = await cRes.json();
        if (!cRes.ok) throw new Error(cases?.error || "Failed to load cases");
        setActiveCases(Array.isArray(cases) ? cases.filter(c => c.status === "open").length : 0);

        // 3) hearings (future nextDate only)
        const now = Date.now();
        const rows = [];
        for (const c of cases) {
          const hRes = await fetch(`${API}/api/hearings?caseId=${c._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const list = await hRes.json();
          if (!hRes.ok || !Array.isArray(list)) continue;

          for (const h of list) {
            if (h?.nextDate && new Date(h.nextDate).getTime() > now) {
              rows.push({
                _id: h._id,
                caseId: c._id,
                caseTitle: c.title,
                caseNumber: c.number,
                outcome: h.outcome || "",
                nextDate: h.nextDate,
              });
            }
          }
        }

        rows.sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
        setUpcomingHearings(rows.slice(0, 5));
      } catch (e) {
        setErr(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <NavbarDashboard />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Two-line greeting + date */}
        <h1 className="text-2xl font-bold leading-tight">
          {greeting()}
          <br />
          <span className="text-gray-700">
            Welcome back{userName ? `, ${userName}` : ""}!
          </span>
        </h1>
        <p className="mt-1 text-gray-600">{new Date().toLocaleDateString()}</p>

        {err && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {err}
          </p>
        )}

        {/* Tiles */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Active cases */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Active cases</h3>
            <p className="mt-2 text-4xl font-bold">{activeCases}</p>
          </div>

          {/* Upcoming hearings */}
          <div className="md:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upcoming hearings</h3>
            </div>

            {loading ? (
              <p className="mt-2 text-gray-500">Loading…</p>
            ) : upcomingHearings.length === 0 ? (
              <p className="mt-2 text-gray-500">No upcoming hearings.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcomingHearings.map((h) => (
                  <li
                    key={h._id}
                    onClick={() => setOpenCaseId(h.caseId)}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    title="Open case details"
                  >
                    <div>
                      <p className="font-medium">
                        {h.caseTitle} (#{h.caseNumber})
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(h.nextDate).toLocaleString()}
                      </p>
                    </div>
                    {h.outcome && (
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                        {h.outcome}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Case details drawer */}
      {openCaseId && (
        <CaseDetailsOverlay caseId={openCaseId} onClose={() => setOpenCaseId(null)} />
      )}
    </main>
  );
}
