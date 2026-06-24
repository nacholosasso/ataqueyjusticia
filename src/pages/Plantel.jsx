import Formacion from '../components/Formacion';
import Hero from '../components/Hero';

export default function Plantel() {
  return (
    <div>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <section>
          <Formacion />
        </section>
      </div>
    </div>
  );
}
