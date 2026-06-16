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
      className="relative w-full overflow-hidden text-white pt-24 pb-20 sm:pt-32 sm:pb-32"
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

      <div className="relative z-10 flex w-full flex-col items-center px-6 sm:px-10 lg:px-16">
        <div className="flex w-full max-w-5xl flex-col items-center text-center">
          <h2 className="font-outfit font-black uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl md:whitespace-nowrap motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]">
            La porte d'entrée pour{' '}
            <span className="text-dodje-green whitespace-nowrap">débuter</span>
          </h2>

          <ul className="mt-14 sm:mt-20 flex w-full max-w-3xl flex-col items-center justify-center gap-12 sm:flex-row sm:items-start sm:gap-16 lg:gap-20">
            {STATS.map((stat, i) => (
              <li
                key={stat.label}
                className="flex w-full max-w-[17rem] sm:w-[17rem] sm:shrink-0 flex-col items-center text-center motion-safe:animate-[heroFadeUp_700ms_cubic-bezier(0.4,0,0.2,1)_both]"
                style={{ animationDelay: `${80 * i}ms` }}
              >
                <div className="font-outfit font-black leading-none text-6xl sm:text-7xl lg:text-8xl text-white">
                  <AnimatedCounter
                    to={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    monospaceDigits
                  />
                </div>
                <p className="font-outfit mt-4 text-sm sm:text-base uppercase tracking-[0.12em] text-dodje-green">
                  {stat.label}
                </p>
                <p className="font-outfit mt-2 text-sm sm:text-base text-white/60 leading-relaxed text-balance">
                  {stat.caption}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
