import { useState } from "react";
import { Link } from "react-router-dom";
import NavbarHome from "../../components/NavbarHome.jsx";
const API = import.meta.env.VITE_API_URL;

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "",
    barRegNo: "",
    password: "",
    confirmPassword:""
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const { confirmPassword, ...payload } = form;

    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Signup failed");
      }

      const data = await res.json();
      alert(`Signup success! Welcome, ${data.name || payload.name}`);
      // (optional) navigate to login page here
    } catch (err) {
      setError(err.message);
    }
};

  return (
    <main className="flex-1">
    <NavbarHome/>
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border bg-white/90 backdrop-blur p-8 shadow">
          <h1 className="text-3xl font-bold text-center">Create account</h1>
          <p className="mt-2 text-center text-gray-600">
            Join EasyCase (Lawyer)
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            {/* Name */}
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g., Vanuja Karunaratne"
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@example.com"
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>

            {/* Mobile (Sri Lanka) */}
            <div>
              <label className="block text-sm mb-1">Mobile (Sri Lanka)</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={onChange}
                placeholder="07XXXXXXXX or +947XXXXXXXX"
                inputMode="tel"
                pattern="^(?:\+94|0)7\d{8}$"
                title="Use 07XXXXXXXX or +947XXXXXXXX"
                className="w-full rounded-lg border px-4 py-2"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: <code>07XXXXXXXX</code> or <code>+947XXXXXXXX</code>
              </p>
            </div>

            {/* Date of birth */}
            <div>
              <label className="block text-sm mb-1">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={onChange}
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm mb-1">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={onChange}
                className="w-full rounded-lg border px-4 py-2 bg-white"
                required
              >
                <option value="" disabled>Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
                <option>Other</option>
              </select>
            </div>

            {/* BAR Association reg no */}
            <div>
              <label className="block text-sm mb-1">BAR Association Reg. No.</label>
              <input
                name="barRegNo"
                value={form.barRegNo}
                onChange={onChange}
                placeholder="e.g., BASL/12345"
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>
            {/* Password */}
           <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border px-4 py-2"
            required
            minLength={8}
          />
          <p className="mt-1 text-xs text-gray-500">
            Use at least 8 characters. Add numbers & symbols for a stronger password.
          </p>
        </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="Re-enter password"
              className="w-full rounded-lg border px-4 py-2"
              required
              minLength={8}
            />
          </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-black text-white py-2.5 font-semibold"
            >
              Sign up
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold underline">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
