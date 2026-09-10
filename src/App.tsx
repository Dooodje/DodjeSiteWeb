import CharacterCarousel, { type CarouselItem } from './components/CharacterCarousel';
import atelierImg from './assets/batiments/stills/job-1.png';
import moulinImg from './assets/batiments/stills/moulin-1.png';
import reserveImg from './assets/batiments/stills/ruines.png';
import phareImg from './assets/batiments/stills/phare-1.png';
import agenceImg from './assets/batiments/stills/agence-1.png';
import foreuseImg from './assets/batiments/stills/foreuse-1.png';

const items: CarouselItem[] = [
  {
    id: 'atelier',
    image: atelierImg,
    tagline: 'Ton job',
    title: "L'atelier",
    description:
      "L'équivalent de ton job. Tape sur le bâtiment pour gagner un salaire à chaque session — une nouvelle est disponible toutes les deux heures."
  },
  {
    id: 'moulin',
    image: moulinImg,
    tagline: 'Ton épargne',
    title: 'Le moulin',
    description:
      "Ton épargne de précaution : sûre, mais pas très généreuse. Idéale pour mettre de côté ce que tu ne veux pas prendre de risque à investir."
  },
  {
    id: 'reserve',
    image: reserveImg,
    tagline: 'Ta banque',
    title: 'La réserve',
    description:
      "Ta banque pour protéger ton argent — mais elle ne le fait pas grandir. Pire : il fond un peu chaque jour à cause de l'inflation."
  },
  {
    id: 'phare',
    image: phareImg,
    tagline: 'Tes placements',
    title: 'Le phare',
    description:
      "Tes placements financiers. Investis ton argent en bourse, ETF ou immobilier pour faire grandir ton patrimoine sur le long terme."
  },
  {
    id: 'agence',
    image: agenceImg,
    tagline: 'Ton immobilier',
    title: "L'agence",
    description:
      "Ton portefeuille immobilier. Achète, loue, valorise — l'immobilier prend du temps mais construit un patrimoine solide pierre après pierre."
  },
  {
    id: 'foreuse',
    image: foreuseImg,
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
      className="relative flex h-[100svh] min-h-[100svh] w-full flex-col overflow-hidden text-white"
    >
      <div className="relative shrink-0 flex flex-col items-center text-center px-6 pt-8 sm:pt-14 lg:pt-16 pb-2 sm:pb-3">
        <h2 className="font-outfit font-black uppercase tracking-tight leading-[0.95] text-3xl sm:text-5xl md:text-6xl max-w-3xl">
          De la théorie à la <span className="text-dodje-green">pratique</span>
        </h2>
        <p className="font-outfit text-sm sm:text-lg text-white/75 max-w-2xl mt-2 sm:mt-3 leading-relaxed">
          Récupère des Dodjis, débloque des bâtiments et prends des décisions financières sur ton île. Apprendre à gérer son argent n'a jamais été aussi fun.
        </p>
      </div>

      <div className="relative min-h-0 flex-1 w-full h-full">
        <CharacterCarousel items={items} />
      </div>
    </section>
  );
}
