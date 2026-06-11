import CharacterCarousel, { type CarouselItem } from './components/CharacterCarousel';

// Building Lottie animations (level 1 of each)
import jobLottie from './assets/batiments/job-1.json';
import moulinLottie from './assets/batiments/moulin-1.json';
import ruinesLottie from './assets/batiments/ruines.json';
import phareLottie from './assets/batiments/phare-1.json';
import agenceLottie from './assets/batiments/agence-1.json';
import foreuseLottie from './assets/batiments/foreuse-1.json';

const items: CarouselItem[] = [
  {
    id: 'atelier',
    building: jobLottie,
    tagline: 'Ton job',
    title: "L'atelier",
    description:
      "L'équivalent de ton job. Tape sur le bâtiment pour gagner un salaire à chaque session — une nouvelle est disponible toutes les deux heures."
  },
  {
    id: 'moulin',
    building: moulinLottie,
    tagline: 'Ton épargne',
    title: 'Le moulin',
    description:
      "Ton épargne de précaution : sûre, mais pas très généreuse. Idéale pour mettre de côté ce que tu ne veux pas prendre de risque à investir."
  },
  {
    id: 'reserve',
    building: ruinesLottie,
    tagline: 'Ta banque',
    title: 'La réserve',
    description:
      "Ta banque pour protéger ton argent — mais elle ne le fait pas grandir. Pire : il fond un peu chaque jour à cause de l'inflation."
  },
  {
    id: 'phare',
    building: phareLottie,
    tagline: 'Tes placements',
    title: 'Le phare',
    description:
      "Tes placements financiers. Investis ton argent en bourse, ETF ou immobilier pour faire grandir ton patrimoine sur le long terme."
  },
  {
    id: 'agence',
    building: agenceLottie,
    tagline: 'Ton immobilier',
    title: "L'agence",
    description:
      "Ton portefeuille immobilier. Achète, loue, valorise — l'immobilier prend du temps mais construit un patrimoine solide pierre après pierre."
  },
  {
    id: 'foreuse',
    building: foreuseLottie,
    tagline: 'Ton wallet',
    title: 'La foreuse',
    description:
      "Ton wallet crypto. Explore un nouveau monde : Bitcoin, Ethereum, blockchain. Plus volatil, plus risqué — mais Dodje t'apprend à le comprendre avant d'agir."
  }
];

export default function App() {
  return (
    <section
      id="batiments"
      className="relative w-full overflow-hidden text-white"
      style={{ height: '90svh', minHeight: '640px' }}
    >
      {/* Section title overlay — generous space above title, clear gap below. */}
      <div className="relative pointer-events-none z-[40] flex flex-col items-center text-center px-6 pt-14 sm:pt-20 lg:pt-24 lg:pb-8">
        <h2 className="font-arboria font-black uppercase tracking-tight leading-[0.95] text-3xl sm:text-5xl md:text-6xl max-w-3xl">
          De la théorie à la <span className="text-dodje-green">pratique</span>
        </h2>
      </div>

      {/* Mobile: full section. Desktop: buildings start below title with
          clean separation; bottom margin from panel kept tight. */}
      <div className="absolute inset-0 lg:top-44">
        <CharacterCarousel items={items} />
      </div>
    </section>
  );
}
