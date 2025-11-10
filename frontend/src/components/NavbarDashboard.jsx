import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function NavbarDashboard() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const base =
    "px-3 py-2 rounded-lg font-medium text-lg transition-colors hover:bg-blue-50 hover:text-blue-700";
  const active =
    "px-3 py-2 rounded-lg font-semibold text-lg bg-blue-100 text-blue-800";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const cls = ({ isActive }) => (isActive ? active : base);

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-6xl h-20 px-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/easy-case-logo.png"
            alt="EasyCase logo"
            className="h-15 w-15 object-contain"
          />
          <span className="!text-[30px] font-semibold">EasyCase</span>
        </Link>

        {/* mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {/* desktop */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink to="/dashboard" className={cls}>
            Dashboard
          </NavLink>
          <NavLink to="/cases" className={cls}>
            Cases
          </NavLink>
          <NavLink to="/clients" className={cls}>
            Clients
          </NavLink>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg font-semibold bg-black text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-2">
            <NavLink to="/dashboard" onClick={() => setOpen(false)} className={cls}>
              Dashboard
            </NavLink>
            <NavLink to="/cases" onClick={() => setOpen(false)} className={cls}>
              Cases
            </NavLink>
            <NavLink to="/clients" onClick={() => setOpen(false)} className={cls}>
              Clients
            </NavLink>
            <NavLink to="/calendar" onClick={() => setOpen(false)} className={cls}>
              Calendar
            </NavLink>
            <NavLink to="/settings" onClick={() => setOpen(false)} className={cls}>
              Settings
            </NavLink>
            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="px-4 py-2 rounded-lg font-semibold bg-black text-white"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
