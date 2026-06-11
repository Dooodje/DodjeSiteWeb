import { motion } from 'framer-motion';
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

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
    }
  })
};

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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mb-14 sm:mb-20"
        >
          <h2 className="font-arboria font-black uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl">
            Tout pour <span className="text-dodje-green">commencer</span>.
          </h2>
        </motion.div>

        {/* Stat grid — minimal, no card chrome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-16">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-10%' }}
              className="flex flex-col"
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
