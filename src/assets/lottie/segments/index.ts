/** Landing-page segment Lottie animations — lazy-loaded per segment. */
export const segmentLottie = {
  experiencePersonnalisee: () =>
    import('./experience-personnalisee.json').then((m) => m.default),
  progresVisible: () =>
    import('./progres-visible.json').then((m) => m.default),
  mouvementNecessaire: () =>
    import('./mouvement-necessaire.json').then((m) => m.default),
  gratuitSimpleLudique: () =>
    import('./gratuit-simple-ludique.json').then((m) => m.default)
} as const;

export type SegmentLottieId = keyof typeof segmentLottie;
