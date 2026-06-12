import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { segmentLottie } from '../assets/lottie/segments';
import parcoursGif from '../../assets/anime/Parcours.gif';
import SegmentLottie from './SegmentLottie';

type PillarMedia =
  | { kind: 'gif'; src: string }
  | {
      kind: 'lottie';
      loadAnimation: () => Promise<object>;
      aspectClass: string;
      scaleClass: string;
    };

type Pillar = {
  number: string;
  titleLine1: string;
  titleAccent: string;
  body: string;
  media: PillarMedia;
  alt: string;
};

const PILLARS: Pillar[] = [
  {
    number: '01',
    titleLine1: 'Un parcours',
    titleAccent: 'progressif',
    body:
      'Avec Dodje, tu avances à ton rythme. Tu commences par les bases, tu débloques de nouvelles notions petit à petit, et tu comprends enfin la finance sans te sentir perdu.',
    media: { kind: 'gif', src: parcoursGif },
    alt: 'Parcours d’apprentissage progressif'
  },
  {
    number: '02',
    titleLine1: 'Ton argent',
    titleAccent: 'en clair',
    body:
      'On parle souvent d’argent, mais rarement de façon simple. Dodje t’aide à prendre de bonnes habitudes et à mieux comprendre les décisions qui comptent dans ta vie.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.mouvementNecessaire,
      aspectClass: 'aspect-square',
      scaleClass: 'scale-[1.1] sm:scale-[1.2] lg:scale-[1.3]'
    },
    alt: 'Notification Dodje — ton argent en clair'
  },
  {
    number: '03',
    titleLine1: 'Gratuit. Simple.',
    titleAccent: 'Ludique.',
    body:
      'Apprendre avec Dodje, c’est gratuit, clair et motivant. Les leçons sont courtes, les quiz te font pratiquer, et chaque progrès te donne envie de continuer.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.gratuitSimpleLudique,
      aspectClass: 'aspect-square',
      scaleClass: 'scale-[1.1] sm:scale-[1.2] lg:scale-[1.3]'
    },
    alt: 'Daily reward Dodje — gratuit, simple et ludique'
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

const floatTransition = (delay: number) => ({
  duration: 5,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  delay
});

export default function Pillars() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="pillars"
      className="relative w-full overflow-x-hidden text-white py-24 sm:py-36"
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
        <div className="flex flex-col gap-28 sm:gap-40">
          {PILLARS.map((pillar, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={pillar.number}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-20 items-center ${
                  reverse ? 'lg:[direction:rtl]' : ''
                } ${pillar.media.kind === 'lottie' ? 'overflow-visible' : ''}`}
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
                </motion.div>

                <motion.div
                  variants={visualVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-10%' }}
                  className={`relative flex items-center justify-center [direction:ltr] ${
                    pillar.media.kind === 'lottie' ? 'overflow-visible' : ''
                  }`}
                  animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
                  transition={floatTransition(i * 0.4)}
                >
                  {pillar.media.kind === 'lottie' ? (
                    <div
                      className={`w-full max-w-[460px] origin-center ${pillar.media.scaleClass}`}
                    >
                      <SegmentLottie
                        loadAnimation={pillar.media.loadAnimation}
                        alt={pillar.alt}
                        reducedMotion={reducedMotion}
                        className={`relative z-10 w-full ${pillar.media.aspectClass}`}
                      />
                    </div>
                  ) : (
                    <img
                      src={pillar.media.src}
                      alt={pillar.alt}
                      width={1080}
                      height={1080}
                      loading="lazy"
                      draggable={false}
                      style={{ backgroundColor: 'transparent' }}
                      className="relative z-10 w-full max-w-[460px] object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
                    />
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
