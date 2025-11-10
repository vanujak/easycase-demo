import { useEffect, useState } from "react";

export default function BackgroundSlideshow({
  images = ["/hero-1.jpg", "/hero-2.jpg", "/hero-3.jpg"],
  interval = 6000, // ms per slide
  fade = 1000,      // ms fade duration (matches Tailwind class below)
}) {
  const [idx, setIdx] = useState(0);

  // advance slides
  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  // (optional) pre-load images
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  return (
    <div className="absolute inset-0 -z-10">
      {/* Slides */}
      {images.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[${fade}ms] ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
          loading="eager"
        />
      ))}

      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
