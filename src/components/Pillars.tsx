import { motion, useReducedMotion, type Variants } from 'framer-motion';

// Reuse the existing brand gifs that already live under /assets/anime
import parcoursGif from '../../assets/anime/Parcours.gif';
import methodeGif from '../../assets/anime/MethodeRevolutionnaire.gif';
import funGif from '../../assets/anime/fun.gif';

type Pillar = {
  number: string;
  titleLine1: string;
  titleAccent: string;
  body: string;
  quote: string;
  gif: string;
  alt: string;
};

const PILLARS: Pillar[] = [
  {
    number: '01',
    titleLine1: 'Un parcours',
    titleAccent: 'progressif',
    body:
      'Tu commences par les bases, tu avances étape par étape, et tu construis des repères solides avant d’aller plus loin.',
    quote: 'On ne naît pas à l’aise avec la finance. On le devient.',
    gif: parcoursGif,
    alt: 'Parcours d’apprentissage progressif'
  },
  {
    number: '02',
    titleLine1: 'Un mouvement',
    titleAccent: 'nécessaire',
    body:
      'On te dit qu’il faut t’intéresser à ton argent, mais rarement de façon claire. Dodje existe pour changer ça.',
    quote: 'Comprendre son argent ne devrait jamais être un privilège.',
    gif: methodeGif,
    alt: 'Méthode révolutionnaire Dodje'
  },
  {
    number: '03',
    titleLine1: 'Gratuit. Simple.',
    titleAccent: 'Ludique.',
    body:
      'Des contenus courts, des formats interactifs et une progression claire pour enfin t’y mettre sans te sentir largué.',
    quote: 'On peut parler d’argent sérieusement sans rendre ça chiant.',
    gif: funGif,
    alt: 'Apprentissage finance ludique'
  }
];

const textVariants: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const textVariantsReverse: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const visualVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function Pillars() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="pillars"
      className="relative w-full overflow-hidden text-white py-24 sm:py-36"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          // Fade the dot grid in/out at section edges so the pattern blends
          // continuously with adjacent sections instead of starting / ending
          // on a hard line.
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)'
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 lg:px-16">
        {/* Pillars */}
        <div className="flex flex-col gap-28 sm:gap-40">
          {PILLARS.map((pillar, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={pillar.number}
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
                    {pillar.titleLine1}
                    <br />
                    <span className="text-dodje-green">
                      {pillar.titleAccent}
                    </span>
                  </h3>
                  <p className="font-arboria text-base sm:text-lg text-white/75 max-w-xl mt-2 leading-relaxed">
                    {pillar.body}
                  </p>
                  <div className="relative mt-5 pl-5 max-w-xl">
                    <span
                      aria-hidden
                      className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-dodje-green"
                    />
                    <p className="font-arboria text-base sm:text-lg italic text-white/90">
                      « {pillar.quote} »
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  variants={visualVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-10%' }}
                  className="relative flex items-center justify-center [direction:ltr]"
                >
                  <motion.img
                    src={pillar.gif}
                    alt={pillar.alt}
                    loading="lazy"
                    draggable={false}
                    animate={
                      reducedMotion
                        ? undefined
                        : { y: [0, -8, 0] }
                    }
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.4
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
