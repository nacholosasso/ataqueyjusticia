import { useEffect, useState } from 'react';
import halconImagen from '../assets/hero/halcon-hero.jpg';
import halconVideo from '../assets/hero/halcon-hero.mp4';

function usePrefiereMenosMovimiento() {
  const [prefiere, setPrefiere] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefiere(media.matches);
    const onChange = (e) => setPrefiere(e.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return prefiere;
}

export default function Hero() {
  const prefiereMenosMovimiento = usePrefiereMenosMovimiento();

  return (
    <div className="relative w-full aspect-[11/6] overflow-hidden">
      {prefiereMenosMovimiento ? (
        <img
          src={halconImagen}
          alt="Halcón sobrevolando el Instituto Ntra. Sra. del Carmen"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <video
          src={halconVideo}
          poster={halconImagen}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/30 to-zinc-950" />
    </div>
  );
}
