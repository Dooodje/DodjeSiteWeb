import { motion, useReducedMotion, type Variants } from 'framer-motion';

// Brand gifs from /assets/anime — one per feature.
import epopeeGif from '../../assets/anime/e_pope_e.gif';
import levelGif from '../../assets/anime/Level.gif';
import recompensesGif from '../../assets/anime/re_compenses.gif';

type Feature = {
  index: string;
  titleLine1: string;
  titleAccent: string;
  body: string;
  gif: string;
  alt: string;
};

const FEATURES: Feature[] = [
  {
    index: '01',
    titleLine1: 'Des parcours',
    titleAccent: 'personnalisés',
    body:
      'Dodje adapte ton point de départ pour t’aider à progresser à ton rythme. Chaque bâtiment représente un domaine financier que tu débloques étape par étape.',
    gif: epopeeGif,
    alt: "Épopée d'apprentissage progressive Dodje"
  },
  {
    index: '02',
    titleLine1: 'Un progrès',
    titleAccent: 'visible',
    body:
      'Chaque action te rapporte de l’XP. Tu vois ta progression en direct, tu débloques des étapes, et tu consolides tes bases. Le but : te sentir moins perdu qu’hier.',
    gif: levelGif,
    alt: 'Progression de niveau Dodje'
  },
  {
    index: '03',
    titleLine1: 'Un apprentissage',
    titleAccent: 'ludique',
    body:
      'Quiz, défis, mini-jeux et Dodjis à collecter : l’app transforme l’apprentissage en expérience vivante. On retient mieux quand on participe vraiment.',
    gif: recompensesGif,
    alt: 'Système de récompenses Dodje'
  }
];

const textVariants: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};
const textVariantsReverse: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};
const visualVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
};

export default function Features() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="relative w-full overflow-hidden text-white py-24 sm:py-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* Features */}
        <div className="flex flex-col gap-28 sm:gap-40">
          {FEATURES.map((f, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={f.index}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-20 items-center ${
                  reverse ? 'lg:[direction:rtl]' : ''
                }`}
              >
                <motion.div
                  variants={reverse ? textVariantsReverse : textVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-10%' }}
                  className="flex flex-col gap-4 [direction:ltr]"
                >
                  <h3 className="font-arboria font-black uppercase tracking-tight leading-[0.95] text-4xl sm:text-5xl md:text-6xl">
                    {f.titleLine1}
                    <br />
                    <span className="text-dodje-green">{f.titleAccent}</span>
                  </h3>
                  <p className="font-arboria text-base sm:text-lg text-white/75 max-w-xl mt-2 leading-relaxed">
                    {f.body}
                  </p>
                </motion.div>

                <motion.div
                  variants={visualVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-10%' }}
                  className="relative flex items-center justify-center [direction:ltr]"
                >
                  <motion.img
                    src={f.gif}
                    alt={f.alt}
                    loading="lazy"
                    draggable={false}
                    animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.35
                    }}
                    className="relative z-10 w-full max-w-[460px] object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
                  />
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
