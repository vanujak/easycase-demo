// src/pages/auth/Login.jsx
import { Link, useNavigate } from "react-router-dom";
import NavbarHome from "../../components/NavbarHome.jsx";
import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();  
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Login failed (${res.status})`);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");     
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1">
      <NavbarHome />
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-2xl border bg-white/90 backdrop-blur p-8 shadow">
          <h1 className="text-3xl font-bold text-center">Log in</h1>
          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <input name="email" type="email" required value={form.email} onChange={onChange}
                   className="w-full rounded-lg border px-4 py-2" placeholder="you@example.com"/>
            <input name="password" type="password" required minLength={6}
                   value={form.password} onChange={onChange}
                   className="w-full rounded-lg border px-4 py-2" placeholder="••••••••"/>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
                    className="w-full rounded-lg bg-black text-white py-2.5 font-semibold disabled:opacity-60">
              {loading ? "Logging in..." : "Log in"}
            </button>
            <p className="text-center text-sm text-gray-600 mt-2">
              Don’t have an account? <Link to="/signup" className="font-semibold underline">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
