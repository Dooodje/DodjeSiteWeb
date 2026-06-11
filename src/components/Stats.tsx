import AnimatedCounter from './AnimatedCounter';

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  caption: string;
};

const STATS: Stat[] = [
  {
    value: 0,
    prefix: '',
    suffix: '€',
    label: 'pour commencer',
    caption: "Gratuit sur iOS et Android. Aucune carte demandée."
  },
  {
    value: 3,
    suffix: ' min',
    label: 'par jour',
    caption: 'Une session courte suffit pour ancrer une habitude durable.'
  }
];

export default function Stats() {
  return (
    <section
      id="stats"
      className="relative w-full overflow-hidden text-white py-24 sm:py-32"
    >
      {/* Subtle dot pattern only — no green blob. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* Section header */}
        <div
          className="max-w-3xl mb-14 sm:mb-20 motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
        >
          <h2 className="font-arboria font-black uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl">
            Tout pour <span className="text-dodje-green">commencer</span>.
          </h2>
        </div>

        {/* Stat grid — minimal, no card chrome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-16">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
              style={{ animationDelay: `${80 * i}ms` }}
            >
              <div className="font-arboria font-black leading-none text-6xl sm:text-7xl lg:text-8xl text-white">
                <AnimatedCounter
                  to={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  monospaceDigits
                />
              </div>
              <p className="font-arboria mt-4 text-sm sm:text-base uppercase tracking-[0.12em] text-dodje-green">
                {stat.label}
              </p>
              <p className="font-arboria mt-2 text-sm sm:text-base text-white/60 leading-relaxed max-w-md">
                {stat.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
