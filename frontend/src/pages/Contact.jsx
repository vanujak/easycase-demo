import { useState } from "react";
import NavbarHome from "../components/NavbarHome.jsx";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault(); // no backend yet
    console.log("contact form", form);
    alert("Message submitted (UI only).");
  };

  return (
    <main className="flex-1">
        <NavbarHome/>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border bg-white/90 backdrop-blur p-8 shadow">
          <h1 className="text-3xl font-bold text-center">Contact Us</h1>
          <p className="mt-2 text-center text-gray-600">
            Send us your questions and we’ll get back to you.
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Your name"
                  className="w-full rounded-lg border px-4 py-2"
                  required
                />
              </div>
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
            </div>

            <div>
              <label className="block text-sm mb-1">Phone (optional)</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="+94 7XXXXXXXX"
                inputMode="tel"
                className="w-full rounded-lg border px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Subject</label>
              <input
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder="How can we help?"
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={onChange}
                placeholder="Write your message..."
                rows={5}
                className="w-full rounded-lg border px-4 py-2"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-black text-white py-2.5 font-semibold"
            >
              Send Message
            </button>
          </form>

          {/* Optional office info */}
          <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="rounded-lg border p-4 bg-white">
              <div className="font-semibold">Email</div>
              <div>support@easycase.lk</div>
            </div>
            <div className="rounded-lg border p-4 bg-white">
              <div className="font-semibold">Phone</div>
              <div>+94 11 234 5678</div>
            </div>
            <div className="rounded-lg border p-4 bg-white">
              <div className="font-semibold">Address</div>
              <div>Colombo, Sri Lanka</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
