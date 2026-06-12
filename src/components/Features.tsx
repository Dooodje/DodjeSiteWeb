import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { segmentLottie } from '../assets/lottie/segments';
import SegmentLottie from './SegmentLottie';

type FeatureMedia = {
  kind: 'lottie';
  loadAnimation: () => Promise<object>;
  aspectClass: string;
  scaleClass: string;
};

type Feature = {
  index: string;
  titleLine1: string;
  titleAccent: string;
  body: string;
  media: FeatureMedia;
  alt: string;
};

const FEATURES: Feature[] = [
  {
    index: '01',
    titleLine1: 'Une expérience',
    titleAccent: 'personnalisée',
    body:
      'Tu choisis le chemin qui t’intéresse, Dodje te guide pour avancer dans le bon ordre. Tu explores les sujets à ton rythme, avec des étapes claires pour ne jamais te sentir perdu.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.experiencePersonnalisee,
      aspectClass: 'aspect-[19/10]',
      scaleClass: 'scale-[1.35] sm:scale-[1.6] lg:scale-[1.95]'
    },
    alt: 'Expérience personnalisée Dodje'
  },
  {
    index: '02',
    titleLine1: 'Un progrès',
    titleAccent: 'visible',
    body:
      'Chaque leçon te fait avancer. Tu gagnes de l’XP, tu débloques de nouvelles étapes, et tu vois clairement ce que tu comprends mieux qu’avant.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.progresVisible,
      aspectClass: 'aspect-[6/7]',
      scaleClass: 'scale-[1.1] sm:scale-[1.2] lg:scale-[1.3]'
    },
    alt: 'Progression de niveau Dodje'
  },
  {
    index: '03',
    titleLine1: 'Un apprentissage',
    titleAccent: 'ludique',
    body:
      'Avec des quiz, des défis et des récompenses à collectionner, apprendre devient plus motivant. Tu pratiques souvent, tu retiens mieux, et tu prends plaisir à continuer.',
    media: {
      kind: 'lottie',
      loadAnimation: segmentLottie.apprentissageLudique,
      aspectClass: 'aspect-square',
      scaleClass: 'scale-[1.1] sm:scale-[1.2] lg:scale-[1.3]'
    },
    alt: 'Apprentissage ludique Dodje'
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

const floatTransition = (delay: number) => ({
  duration: 5,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  delay
});

/** Uniform vertical rhythm between feature rows. */
const FEATURE_STACK_GAP = 'gap-32 lg:gap-36';
/** Same row height on desktop so block spacing reads evenly. */
const FEATURE_ROW =
  'grid lg:grid-cols-2 gap-10 lg:gap-x-20 items-center lg:min-h-[540px]';
/** Fixed visual slot — animations centered regardless of aspect ratio. */
const VISUAL_SLOT =
  'relative flex h-[380px] sm:h-[440px] lg:h-[500px] w-full items-center justify-center overflow-visible [direction:ltr]';

export default function Features() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="features"
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
        <div className={`flex flex-col ${FEATURE_STACK_GAP}`}>
          {FEATURES.map((f, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={f.index}
                className={`${FEATURE_ROW} ${
                  reverse ? 'lg:[direction:rtl]' : ''
                } overflow-visible`}
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
                  className={VISUAL_SLOT}
                  animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
                  transition={floatTransition(i * 0.35)}
                >
                  <div
                    className={`w-full max-w-[460px] origin-center ${f.media.scaleClass}`}
                  >
                    <SegmentLottie
                      loadAnimation={f.media.loadAnimation}
                      alt={f.alt}
                      reducedMotion={reducedMotion}
                      className={`relative z-10 w-full ${f.media.aspectClass}`}
                    />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
