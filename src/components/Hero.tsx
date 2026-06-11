import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ArrowDown, Sparkles } from 'lucide-react';
// Waving mascot — animated GIF: alpha-transparent natively, not interactive,
// no platform play-button overlay. Plays at its baked-in frame rate.
import salutGif from '../../assets/anime/Salut.gif';

const HEADLINE_LINE_1 = ['Comprends', 'ton', 'argent'];
const HEADLINE_LINE_2 = ['simplement', 'et', 'gratuitement.'];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
    }
  }
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.4, 0, 0.2, 1] }
  }
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.4, 0, 0.2, 1] }
  })
};

const TRUST_NOTE =
  'Contenus éducatifs uniquement, sans conseil financier personnalisé.';

export default function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden text-white"
      style={{ minHeight: '100svh' }}
    >
      {/* Background: subtle dot pattern only. No green blobs / halos so the
          hero reads as quietly dark instead of neon-flashy. Masked to fade
          at edges to keep continuity with neighboring sections. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 6%, black 88%, transparent 100%)'
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1500px] px-6 sm:px-10 lg:px-16 pt-12 pb-4 lg:pt-12 lg:pb-6 flex flex-col gap-2 lg:gap-3">
       <div className="grid lg:grid-cols-[0.8fr_1.4fr] gap-3 lg:gap-10 items-center">
        {/* LEFT: Text + CTAs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col gap-2 lg:gap-3"
        >
          {/* Eyebrow chip */}
          <motion.div
            variants={fadeUpVariants}
            custom={0}
            className="inline-flex items-center gap-2 self-start rounded-full
                       border border-white/15 bg-white/5 backdrop-blur
                       px-3.5 py-1.5 text-xs sm:text-sm font-arboria"
          >
            <Sparkles size={14} className="text-dodje-green" />
            <span className="text-white/80">Disponible sur iOS &amp; Android</span>
          </motion.div>

          {/* Headline */}
          <h1 className="font-arboria font-black uppercase tracking-tight leading-[0.92] text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem]">
            <span className="block">
              {HEADLINE_LINE_1.map((word, i) => (
                <motion.span
                  key={`l1-${i}`}
                  variants={wordVariants}
                  className="inline-block mr-[0.18em] last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="block text-dodje-green">
              {HEADLINE_LINE_2.map((word, i) => (
                <motion.span
                  key={`l2-${i}`}
                  variants={wordVariants}
                  className="inline-block mr-[0.18em] last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUpVariants}
            custom={0.7}
            className="font-arboria text-lg sm:text-xl lg:text-[1.35rem] text-white/75 max-w-xl leading-relaxed"
          >
            Dodje est l’app de finance pour débutants qui t’aide à comprendre
            ton argent facilement, même si tu pars de zéro.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUpVariants}
            custom={0.85}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-1"
          >
            <motion.a
              href="https://apps.apple.com/us/app/dodje-%C3%A9ducation-financi%C3%A8re/id6743447215"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="group flex items-center gap-3 px-5 py-3.5 rounded-2xl text-dodje-ink font-arboria font-bold shadow-[0_12px_30px_-12px_rgba(0,0,0,0.55)]"
              style={{
                background: 'linear-gradient(to bottom, #9BEC00 0%, #06D001 100%)'
              }}
            >
              <i className="fab fa-apple text-2xl" aria-hidden />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[0.65rem] uppercase tracking-wide opacity-70">
                  Télécharger sur
                </span>
                <span className="text-base">App Store</span>
              </span>
            </motion.a>
            <motion.a
              href="https://play.google.com/store/apps/details?id=xyz.dodje.app"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="group flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white text-dodje-ink font-arboria font-bold shadow-[0_12px_30px_-8px_rgba(255,255,255,0.25)]"
            >
              <i className="fab fa-google-play text-xl" aria-hidden />
              <span className="flex flex-col leading-tight text-left">
                <span className="text-[0.65rem] uppercase tracking-wide opacity-70">
                  Disponible sur
                </span>
                <span className="text-base">Google Play</span>
              </span>
            </motion.a>
          </motion.div>

          {/* Trust note */}
          <motion.p
            variants={fadeUpVariants}
            custom={1}
            className="text-xs sm:text-sm font-arboria text-white/55 max-w-xl mt-2"
          >
            {TRUST_NOTE}
          </motion.p>
        </motion.div>

        {/* RIGHT: Mascotte with floating bob (arm wave baked in the GIF).
            Green halo behind mascot removed for a calmer, less neon look. */}
        <div className="relative flex items-center justify-center min-h-[420px] lg:min-h-[1040px]">
          <motion.img
            src={salutGif}
            alt="Mascotte Dodje qui salue"
            draggable={false}
            decoding="async"
            fetchPriority="high"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              opacity: { duration: 0.7, delay: 0.3, ease: [0.4, 0, 0.2, 1] },
              scale: { duration: 0.9, delay: 0.3, ease: [0.4, 0, 0.2, 1] }
            }}
            style={{
              transform: 'translateZ(0)',
              willChange: 'transform, opacity',
              pointerEvents: 'none'
            }}
            className="relative z-10 w-[560px] sm:w-[820px] lg:w-[1080px] xl:w-[1200px] max-w-full select-none drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
          />
        </div>
       </div>

        {/* Scroll cue — placed under the trust note, horizontally centered
            across the viewport (in flow so it follows the trust note vertically
            on every breakpoint instead of being anchored to the viewport). */}
        <motion.a
          href="#stats"
          aria-label="Faire défiler vers le bas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="mx-auto mt-2 z-20 flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <span className="text-[0.7rem] uppercase tracking-[0.25em] font-arboria">
            Découvre
          </span>
          <motion.span
            animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
          >
            <ArrowDown size={20} strokeWidth={2.25} />
          </motion.span>
        </motion.a>
      </div>
    </section>
  );
}
