import { Outlet } from "react-router-dom";
import NavbarHome from "../components/NavbarHome.jsx";

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <NavbarHome />
      <Outlet />
    </div>
  );
}
