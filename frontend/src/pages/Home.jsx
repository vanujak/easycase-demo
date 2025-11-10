import NavbarHome from "../components/NavbarHome.jsx";
import BackgroundSlideshow from "../components/BackgroundSlideshow.jsx";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background slideshow (behind everything) */}
      <BackgroundSlideshow
        images={["/hero-1.jpg", "/hero-2.jpg", "/hero-3.jpg"]}
        interval={4500}
        fade={700}
      />
      <NavbarHome />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-4xl font-bold text-white">Welcome to EasyCase</h1>
        <p className="mt-2 text-white/90">Your trusted case management system</p>
      </main>
    </div>
  );
}
