import React, { useState, useMemo } from 'react';
import { Trophy, Skull, Star, Sparkles, Crown, Mic, Music, Smile, Drama, Zap, Heart, Flame, Frown, Meh } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=DragRace&backgroundColor=fdf2f8,f5d0fe&backgroundType=gradientLinear&radius=50';

const createAvatarUrl = (name: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=fdf2f8,f5d0fe&backgroundType=gradientLinear&radius=50`;

// --- TYPES ---
type Stat = 'acting' | 'improv' | 'comedy' | 'dance' | 'design' | 'singing' | 'runway' | 'lipsync' | 'branding' | 'charisma' | 'makeover';
type Placement = 'WIN' | 'TOP2' | 'HIGH' | 'SAFE' | 'LOW' | 'BTM2' | 'ELIM' | 'GUEST' | null;

interface Queen {
  id: string;
  name: string;
  image: string;
  stats: Record<Stat, number>;
  trackRecord: Placement[];
  status: 'active' | 'eliminated' | 'winner';
  eliminatedEpisode: number | null;
  wins: number;
  bottoms: number;
  // Hidden Sim Stats
  favoritism: number; // Riggory factor (0-10)
  momentum: number; // Performance streak (-5 to 5)
  storyline: string;
}

interface Episode {
  number: number;
  title: string;
  challengeType: Stat | 'mix';
  challengeStats: Stat[];
  description: string;
  isPremiere?: boolean;
  isSplitPremiereA?: boolean;
  isSplitPremiereB?: boolean;
  isFinale?: boolean;
  noElimination?: boolean;
}

// --- DATA ---
// S12 adjusted for 13 queens. 
const BASE_STATS = { acting: 5, improv: 5, comedy: 5, dance: 5, design: 5, singing: 5, runway: 5, lipsync: 5, branding: 5, charisma: 5, makeover: 5 };

const INITIAL_CAST_DATA: Partial<Queen>[] = [
  { id: 'jaida', name: 'Jaida Essence Hall', stats: { ...BASE_STATS, design: 9, runway: 10, lipsync: 8, charisma: 8, branding: 7, acting: 6 } },
  { id: 'gigi', name: 'Gigi Goode', stats: { ...BASE_STATS, design: 10, runway: 9, comedy: 8, improv: 8, singing: 7, lipsync: 5 } },
  { id: 'crystal', name: 'Crystal Methyd', stats: { ...BASE_STATS, charisma: 10, comedy: 8, improv: 7, makeover: 9, runway: 8, dance: 4 } },
  { id: 'jackie', name: 'Jackie Cox', stats: { ...BASE_STATS, acting: 9, comedy: 9, improv: 8, branding: 8, lipsync: 7, design: 4 } },
  { id: 'heidi', name: 'Heidi N Closet', stats: { ...BASE_STATS, charisma: 10, comedy: 8, lipsync: 9, acting: 7, runway: 4, design: 3 } },
  { id: 'widow', name: "Widow Von'Du", stats: { ...BASE_STATS, dance: 9, lipsync: 10, singing: 8, comedy: 7, acting: 7, runway: 6 } },
  { id: 'jan', name: 'Jan', stats: { ...BASE_STATS, singing: 10, dance: 8, acting: 7, runway: 7, charisma: 6, comedy: 5 } },
  { id: 'brita', name: 'Brita', stats: { ...BASE_STATS, dance: 7, acting: 6, branding: 6, lipsync: 7, comedy: 5, runway: 5 } },
  { id: 'aiden', name: 'Aiden Zhane', stats: { ...BASE_STATS, acting: 7, design: 6, charisma: 4, improv: 3, comedy: 3, dance: 2 } },
  { id: 'nicky', name: 'Nicky Doll', stats: { ...BASE_STATS, design: 9, runway: 10, makeover: 8, acting: 3, improv: 2, comedy: 2 } },
  { id: 'rock', name: 'Rock M. Sakura', stats: { ...BASE_STATS, dance: 8, design: 6, charisma: 7, runway: 6, improv: 4, acting: 4 } },
  { id: 'dahlia', name: 'Dahlia Sin', stats: { ...BASE_STATS, runway: 8, design: 5, charisma: 3, acting: 2, comedy: 2, lipsync: 3 } },
  { id: 'sherry', name: 'Sherry Pie', stats: { ...BASE_STATS, acting: 9, comedy: 9, improv: 8, branding: 7, runway: 6, lipsync: 4 } },
];

const QUEEN_IMAGE_OVERRIDES: Record<string, string> = {
  // Provide direct image URLs to replace the generated avatars, e.g.:
  jaida: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/8/8e/JaidaEssenceHallS12CastMug.png',
  aiden: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/2/26/AidenZhaneS12CastMug.png',
    gigi: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/b/b8/GigiGoodeS12CastMug.png',
      crystal: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/d/d8/CrystalMethydS12CastMug.png',
        dahlia: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/6/6a/DahliaSinS12CastMug.png',
          brita: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/3/3e/BritaS12CastMug.png',
            jan: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/a/a9/JanS12CastMug.png',
              heidi: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/5/56/HeidiNClosetS12CastMug.png',
                widow: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/3/3d/WidowVon%27DuS12CastMug.png',
                  nicky: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/5/5f/NickyDollS12CastMug.png',
                    rock: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/d/dd/RockMSakuraS12CastMug.png',
                      sherry: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/e/ea/SherryPieS12CastMug.png',
                                            jackie: 'https://static.wikia.nocookie.net/logosrupaulsdragrace/images/e/e7/JackieCoxS12CastMug.png',
};

const EPISODES: Episode[] = [
  { number: 1, title: "I'm That Bitch", challengeType: 'mix', challengeStats: ['dance', 'runway', 'charisma'], description: "Split Premiere Group A: Write a verse and perform choreo.", isPremiere: true, isSplitPremiereA: true, noElimination: true },
  { number: 2, title: "You Don't Know Me", challengeType: 'mix', challengeStats: ['acting', 'dance', 'charisma'], description: "Split Premiere Group B: Fosse-inspired musical number.", isPremiere: true, isSplitPremiereB: true, noElimination: true },
  { number: 3, title: "World's Worst", challengeType: 'acting', challengeStats: ['acting', 'improv'], description: "Improv talent show for acts with no talent." },
  { number: 4, title: "The Ball Ball", challengeType: 'design', challengeStats: ['design', 'runway'], description: "Serve 3 looks: Lady Baller, Basketball Wife, and Balls to the Wall eleganza." },
  { number: 5, title: "Gay's Anatomy", challengeType: 'acting', challengeStats: ['acting'], description: "Medical drama scripted acting challenge." },
  { number: 6, title: "Snatch Game", challengeType: 'comedy', challengeStats: ['improv', 'comedy', 'charisma'], description: "Celebrity impersonation game show." },
  { number: 7, title: "Madonna: The Unauthorized Rusical", challengeType: 'mix', challengeStats: ['singing', 'dance', 'lipsync'], description: "Live singing and dancing musical tribute to Madonna." },
  { number: 8, title: "Droop", challengeType: 'branding', challengeStats: ['branding', 'improv'], description: "Create and market a lifestyle brand product." },
  { number: 9, title: "Choices 2020", challengeType: 'comedy', challengeStats: ['comedy', 'acting', 'improv'], description: "Political debate improvisation." },
  { number: 10, title: "Superfan Makeover", challengeType: 'makeover', challengeStats: ['makeover', 'runway', 'charisma'], description: "Transform drag superfans into your drag daughters." },
  { number: 11, title: "One-Queen Show", challengeType: 'comedy', challengeStats: ['comedy', 'branding', 'charisma'], description: "Write and perform a solo comedy show." },
  { number: 12, title: "Viva Drag Vegas", challengeType: 'mix', challengeStats: ['dance', 'singing', 'lipsync', 'charisma'], description: "Perform a Las Vegas medley number. (Top 5)" },
  { number: 13, title: "Grand Finale", challengeType: 'mix', challengeStats: ['charisma', 'lipsync', 'runway'], description: "The final lip sync for the crown.", isFinale: true },
];

// --- GAME STATES ---
type GameState = 'intro' | 'entrances' | 'promo_chart' | 'challenge_announcement' | 'challenge_performances' | 'results' | 'lipsync_reveal' | 'lipsync_ongoing' | 'elimination' | 'untucked' | 'finale_moment' | 'finale_crowned';

export default function DragRaceSimulator() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [queens, setQueens] = useState<Queen[]>([]);
  const [currentEpIdx, setCurrentEpIdx] = useState(0);
  
  // Mechanics Flags
  const [doubleShantayUsed, setDoubleShantayUsed] = useState(false);
  const [doubleSashayUsed, setDoubleSashayUsed] = useState(false);
  const [splitGroupA, setSplitGroupA] = useState<string[]>([]);

  // Ep Temporary State
  const [placements, setPlacements] = useState<Record<string, Placement>>({});
  const [lipsyncers, setLipsyncers] = useState<Queen[]>([]);
  const [top2, setTop2] = useState<Queen[]>([]);
  const [eliminated, setEliminated] = useState<Queen | null>(null);
  const [eliminated2, setEliminated2] = useState<Queen | null>(null); // For double sashay
  const [currentStoryline, setCurrentStoryline] = useState<string>("");
  const [producerAdjustments, setProducerAdjustments] = useState<Record<string, number>>({});
  const [manualPlacements, setManualPlacements] = useState<Record<string, Placement>>({});

  const currentEp = EPISODES[currentEpIdx];
  const activeQueens = useMemo(() => queens.filter(q => q.status === 'active'), [queens]);

  // --- INITIALIZATION ---
  const startSeason = () => {
    const fullCast: Queen[] = INITIAL_CAST_DATA.map(data => ({
      id: data.id!,
      name: data.name!,
      image: QUEEN_IMAGE_OVERRIDES[data.id!] || data.image || createAvatarUrl(data.name!),
      stats: data.stats as Record<Stat, number>,
      trackRecord: Array(EPISODES.length).fill(null),
      status: 'active',
      eliminatedEpisode: null,
      wins: 0,
      bottoms: 0,
      favoritism: randomInt(1, 10), // Riggory: 10 is Ru's favorite
      momentum: 0,
      storyline: "Ready to show the world who she is."
    }));

    // Handle Split Premiere Groups randomly
    const shuffledIds = shuffleArray(fullCast.map(q => q.id));
    const groupA = shuffledIds.slice(0, 7);
    setSplitGroupA(groupA);

    // Pre-set GUEST placements
    const initializedCast = fullCast.map(q => {
      const newTR = [...q.trackRecord];
      if (groupA.includes(q.id)) {
        newTR[1] = 'GUEST'; // Not in ep 2
      } else {
        newTR[0] = 'GUEST'; // Not in ep 1
      }
      return { ...q, trackRecord: newTR };
    });

    setQueens(initializedCast);
    setCurrentEpIdx(0);
    setDoubleShantayUsed(false);
    setDoubleSashayUsed(false);
    setGameState('entrances'); // Start with entrances for EP1
    setProducerAdjustments({});
    setManualPlacements({});
  };

  // --- SIMULATION CORE ---
  const getQueenScore = (queen: Queen, ep: Episode, adjustment = 0) => {
    let raw = 0;
    ep.challengeStats.forEach(s => raw += queen.stats[s]);
    let avg = raw / ep.challengeStats.length;

    // Riggory & Variance
    let score = avg + randomFloat(-1.5, 1.5); // Base variance
    score += (queen.stats.runway * 0.15); // Runway always helps slightly
    score += (queen.favoritism * 0.2); // Production favoritism helps slightly
    score += (queen.momentum * 0.3); // Momentum helps/hurts

    // Narrative Caps
    if (queen.wins >= 3 && randomFloat(0, 1) > 0.7) score -= 2; // harder to get 4th win

    return score + adjustment;
  };

  const runEpisode = () => {
    setGameState('challenge_performances');

    if (currentEp.isFinale) {
      setTimeout(() => handleFinale(), 2000);
      return;
    }

    // Filter queens competing THIS episode
    const competingQueens = activeQueens.filter(q => q.trackRecord[currentEpIdx] !== 'GUEST');

    // Check if producer manually set all placements
    const hasManualPlacements = Object.keys(manualPlacements).length > 0;

    if (hasManualPlacements) {
      // Use manual placements
      setPlacements(manualPlacements);
      setManualPlacements({});

      // Determine lipsyncers from manual placements
      const bottomQueens = competingQueens.filter(q => manualPlacements[q.id] === 'BTM2');
      const topQueens = competingQueens.filter(q => manualPlacements[q.id] === 'TOP2');

      if (currentEp.isPremiere) {
        setTop2(topQueens);
        setLipsyncers([]);
      } else {
        setTop2([]);
        setLipsyncers(bottomQueens);
      }

      setTimeout(() => setGameState('results'), 2000);
      return;
    }

    // Score them automatically
    const adjustments = producerAdjustments;
    let scored = competingQueens.map(q => ({ q, score: getQueenScore(q, currentEp, adjustments[q.id] || 0) }));
    scored.sort((a, b) => b.score - a.score);

    // Assign Placements based on format
    const newPlacements: Record<string, Placement> = {};
    const count = competingQueens.length;

    if (currentEp.isPremiere) {
      // TOP 2 Format for premieres
      scored.forEach((s, i) => {
        if (i < 2) newPlacements[s.q.id] = 'TOP2';
        else if (i < count - 2) newPlacements[s.q.id] = 'SAFE';
        else newPlacements[s.q.id] = 'LOW'; // Just for flavor, no one goes home
      });
      setTop2([scored[0].q, scored[1].q]);
      setLipsyncers([]);
    } else {
      // Standard or Finale-ish formats with dynamic placements
      const winCount = 1;
      let bottomCount = Math.min(2, Math.max(1, count - 1));
      if (currentEp.noElimination) bottomCount = 0;

      const availableForCritiques = Math.max(0, count - (winCount + bottomCount));

      let highTarget = 0;
      let lowTarget = 0;

      if (count === 5 && bottomCount === 2 && !currentEp.noElimination) {
        highTarget = 2;
        lowTarget = 0;
      } else {
        highTarget = Math.min(2, availableForCritiques);
        if (availableForCritiques >= 3) {
          highTarget = Math.min(highTarget, availableForCritiques - 1);
        }

        if (availableForCritiques > highTarget && !currentEp.noElimination) {
          lowTarget = 1;
        }

        if (highTarget + lowTarget > availableForCritiques) {
          lowTarget = Math.max(0, availableForCritiques - highTarget);
        }
      }

      const scores = scored.map(s => s.score);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / count;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / count;
      const stdDev = Math.sqrt(variance || 0.0001);

      const highThreshold = averageScore + stdDev * 0.35;
      const lowThreshold = averageScore - stdDev * 0.35;

      const winners = scored.slice(0, winCount);
      winners.forEach(({ q }) => {
        newPlacements[q.id] = 'WIN';
      });

      const bottomContestants = scored.slice(count - bottomCount);
      bottomContestants.forEach(({ q }) => {
        newPlacements[q.id] = bottomCount > 0 ? 'BTM2' : 'SAFE';
      });

      const highs: string[] = [];
      for (let i = winCount; i < count - bottomCount; i++) {
        const entry = scored[i];
        if (entry.score >= highThreshold && highs.length < highTarget) {
          newPlacements[entry.q.id] = 'HIGH';
          highs.push(entry.q.id);
        }
      }

      if (highs.length < highTarget) {
        for (let i = winCount; i < count - bottomCount && highs.length < highTarget; i++) {
          const entry = scored[i];
          if (!newPlacements[entry.q.id]) {
            newPlacements[entry.q.id] = 'HIGH';
            highs.push(entry.q.id);
          }
        }
      }

      const lows: string[] = [];
      for (let i = count - bottomCount - 1; i >= winCount; i--) {
        const entry = scored[i];
        if (newPlacements[entry.q.id]) continue;
        if (entry.score <= lowThreshold && lows.length < lowTarget) {
          newPlacements[entry.q.id] = 'LOW';
          lows.push(entry.q.id);
        }
      }

      if (lowTarget > 0 && lows.length < lowTarget) {
        for (let i = count - bottomCount - 1; i >= winCount && lows.length < lowTarget; i--) {
          const entry = scored[i];
          if (!newPlacements[entry.q.id]) {
            newPlacements[entry.q.id] = 'LOW';
            lows.push(entry.q.id);
          }
        }
      }

      scored.forEach(({ q }) => {
        if (!newPlacements[q.id]) {
          newPlacements[q.id] = 'SAFE';
        }
      });

      setTop2([]);
      setLipsyncers(bottomCount > 0 ? bottomContestants.map(s => s.q) : []);
    }

    setPlacements(newPlacements);
    setProducerAdjustments({});
    setTimeout(() => setGameState('results'), 2000);
  };

  // --- LIPSYNC LOGIC ---
  const runLipsync = () => {
    setGameState('lipsync_ongoing');
    
    if (currentEp.isPremiere) {
      // TOP 2 WINNER
      const [q1, q2] = top2;
      const s1 = q1.stats.lipsync + randomFloat(0, 5) + (q1.momentum * 0.5);
      const s2 = q2.stats.lipsync + randomFloat(0, 5) + (q2.momentum * 0.5);
      const winner = s1 > s2 ? q1 : q2;
      
      const finalPlacements = { ...placements };
      finalPlacements[winner.id] = 'WIN';
      // Loser stays TOP2
      
      setTimeout(() => {
        finalizeEpisode(finalPlacements, null);
        setCurrentStoryline(`${winner.name} proved she's that bitch and snatched the first win.`);
      }, 3000);
      return;
    }

    // REGULAR ELIMINATION LIPSYNC
    const [q1, q2] = lipsyncers;
    let s1 = q1.stats.lipsync * 1.5 + randomFloat(-2, 6) + q1.favoritism*0.3;
    let s2 = q2.stats.lipsync * 1.5 + randomFloat(-2, 6) + q2.favoritism*0.3;

    // Track record weight
    s1 += (q1.wins * 2) - (q1.bottoms * 1.5);
    s2 += (q2.wins * 2) - (q2.bottoms * 1.5);

    const hasFutureElimination = EPISODES.slice(currentEpIdx + 1).some(ep => !ep.isFinale && !ep.noElimination);
    const shouldForceDoubleShantay = !doubleShantayUsed && !currentEp.noElimination && !hasFutureElimination;

    setTimeout(() => {
       // CHECK TWISTS
       const bothDidWell = s1 > 12 && s2 > 12;
       const bothDidBad = s1 < 5 && s2 < 5;
       const closeCall = Math.abs(s1 - s2) < 2;

       if (shouldForceDoubleShantay || (bothDidWell && closeCall && !doubleShantayUsed && activeQueens.length > 6)) {
         // DOUBLE SHANTAY
         setDoubleShantayUsed(true);
         setCurrentStoryline(shouldForceDoubleShantay
           ? "The producers demand a gag-worthy moment! A forced double shantay keeps both queens in the race."
           : "It was too close to call! A double shantay saves both queens."
         );
         finalizeEpisode(placements, null);
       } else if (bothDidBad && !doubleSashayUsed && activeQueens.length > 8 && !currentEp.noElimination) {
         // DOUBLE SASHAY (RARE)
         setDoubleSashayUsed(true);
         setEliminated(q1); setEliminated2(q2);
         setCurrentStoryline("Neither queen impressed. RuPaul sends them BOTH packing in a shocking twist!");
         setGameState('elimination');
         finalizeEpisode(placements, [q1.id, q2.id]);
       } else {
         // STANDARD ELIM
         const loser = s1 > s2 ? q2 : q1;
         setEliminated(loser); setEliminated2(null);
         setCurrentStoryline(`${loser.name} couldn't keep up in the lip sync and was asked to sashay away.`);
         setGameState('elimination');
         finalizeEpisode(placements, [loser.id]);
       }
    }, 4000);
  };

  const finalizeEpisode = (finalPlacements: Record<string, Placement>, elimIds: string[] | null) => {
    setQueens(prev => prev.map(q => {
      if (q.status !== 'active') return q;
      if (q.trackRecord[currentEpIdx] === 'GUEST') return q;

      const place = finalPlacements[q.id];
      const newTR = [...q.trackRecord];
      newTR[currentEpIdx] = place;

      let newWins = q.wins + (place === 'WIN' ? 1 : 0);
      let newBottoms = q.bottoms + (place === 'BTM2' ? 1 : 0);
      let newMomentum = q.momentum;
      
      // Momentum Logic
      if (['WIN', 'TOP2', 'HIGH'].includes(place || '')) newMomentum = Math.min(5, newMomentum + 1);
      if (['LOW', 'BTM2'].includes(place || '')) newMomentum = Math.max(-5, newMomentum - 1.5);
      if (place === 'SAFE') newMomentum = newMomentum > 0 ? newMomentum - 0.5 : newMomentum + 0.5; // Revert to mean

      let newStatus = q.status;
      let elimEp = q.eliminatedEpisode;
      if (elimIds && elimIds.includes(q.id)) {
        newStatus = 'eliminated';
        elimEp = currentEp.number;
        newTR[currentEpIdx] = 'ELIM';
      }

      return { ...q, trackRecord: newTR, wins: newWins, bottoms: newBottoms, momentum: newMomentum, status: newStatus, eliminatedEpisode: elimEp };
    }));

    if (!elimIds) {
      // If no elimination immediately shown, wait then go to untucked (e.g. double shantay or premiere)
      if (gameState !== 'elimination') { // if not already in elim state (double shantay jumps here)
          setTimeout(() => setGameState('untucked'), 4000);
      }
    }
  };

  const nextEpisode = () => {
    if (currentEpIdx < EPISODES.length - 1) {
      setCurrentEpIdx(p => p + 1);
      setGameState('promo_chart'); // Always go to promo chart for subsequent episodes
      setPlacements({});
      setLipsyncers([]);
      setTop2([]);
      setEliminated(null); setEliminated2(null);
      setCurrentStoryline("");
      setManualPlacements({});
    }
  };

  const handleFinale = () => {
    setGameState('finale_moment');
    // Top 3/4 usually. Get active queens.
    const finalists = queens.filter(q => q.status === 'active');
    // Score based on WHOLE season + Charisma
    const finalScores = finalists.map(q => {
      let score = (q.wins * 4) - (q.bottoms * 2) + (q.stats.charisma * 1.5) + (q.favoritism * 0.5);
      // Small random factor for 'finale lipsync' performance
      score += randomFloat(0, 5);
      return { q, score };
    }).sort((a, b) => b.score - a.score);

    const winner = finalScores[0].q;

    setTimeout(() => {
      setQueens(prev => prev.map(q => q.id === winner.id ? { ...q, status: 'winner', trackRecord: [...q.trackRecord.slice(0, -1), 'WIN'] } : q));
      setGameState('finale_crowned');
    }, 4000);
  };

  // --- UI HELPERS ---
  const getPlaceColor = (p: Placement) => {
    if (p === 'WIN') return 'bg-yellow-400 text-yellow-950 border-yellow-500';
    if (p === 'TOP2') return 'bg-cyan-300 text-cyan-950 border-cyan-400';
    if (p === 'HIGH') return 'bg-green-300 text-green-950 border-green-400';
    if (p === 'LOW') return 'bg-orange-300 text-orange-950 border-orange-400';
    if (p === 'BTM2') return 'bg-red-400 text-red-950 border-red-500';
    if (p === 'ELIM') return 'bg-gray-800 text-white border-gray-900';
    if (p === 'GUEST') return 'bg-gray-100 text-gray-400';
    if (p === 'SAFE') return 'bg-stone-200 text-stone-700 border-stone-300';
    return 'bg-gray-50';
  };

  // --- COMPONENTS ---
  const QueenAvatar = (
    { queen, size = 'md', className }: { queen?: Queen; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }
  ) => {
    const sizeMap = {
      sm: 'w-12 h-12',
      md: 'w-20 h-20',
      lg: 'w-24 h-24',
      xl: 'w-32 h-32 md:w-48 md:h-48',
    } as const;

    const borderMap = {
      sm: 'border-2',
      md: 'border-4',
      lg: 'border-4',
      xl: 'border-[6px]',
    } as const;

    return (
      <div
        className={cn(
          'relative rounded-full overflow-hidden bg-gradient-to-br from-pink-200 via-fuchsia-200 to-purple-300 border-pink-200 shadow-inner flex items-center justify-center',
          sizeMap[size],
          borderMap[size],
          className
        )}
      >
        <img
          src={queen?.image || DEFAULT_AVATAR}
          alt={queen ? `${queen.name} avatar` : 'Drag Race queen avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  };

  const QueenCard = ({ queen, mini = false }: { queen: Queen, mini?: boolean }) => {
    const place = placements[queen.id];
    return (
      <div className={cn(
        "relative bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all duration-300",
        queen.status === 'eliminated' ? "border-gray-200 opacity-60 grayscale" : "border-pink-100 hover:border-pink-300 hover:shadow-xl hover:-translate-y-1",
        place && gameState !== 'simulating' && getPlaceColor(place) + " bg-opacity-20 border-opacity-100",
        mini ? "p-2" : "p-4"
      )}>
        {queen.status === 'winner' && <Crown className="absolute top-1 right-1 h-6 w-6 text-yellow-500 animate-bounce" />}
        {queen.status === 'eliminated' && <Skull className="absolute top-2 right-2 h-4 w-4 text-gray-400" />}

        <div className="flex flex-col items-center text-center space-y-2">
          <QueenAvatar queen={queen} size={mini ? 'sm' : 'md'} className={mini ? 'border-pink-300' : 'border-pink-200'} />
          <div className="w-full">
             <h3 className={cn("font-bold leading-tight", mini ? "text-xs truncate" : "text-sm md:text-base line-clamp-2 h-10 flex items-center justify-center")}>{queen.name}</h3>
             {!mini && queen.status === 'active' && (
               <div className="flex justify-center gap-3 mt-2 text-xs text-gray-500 font-semibold">
                 <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-yellow-500"/>{queen.wins}</span>
                 <span className="flex items-center gap-1"><Frown className="h-3 w-3 text-red-500"/>{queen.bottoms}</span>
               </div>
             )}
          </div>
        </div>
        {place && gameState !== 'simulating' && (
          <div className={cn("absolute bottom-0 left-0 right-0 text-center text-[10px] font-black uppercase tracking-widest py-0.5", getPlaceColor(place))}>
            {place === 'TOP2' ? 'TOP 2' : place}
          </div>
        )}
      </div>
    )
  };

  const ProducerRoom = () => {
    const eligibleQueens = activeQueens
      .filter(q => q.trackRecord[currentEpIdx] !== 'GUEST')
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!eligibleQueens.length) return null;

    const hasManualOverrides = Object.keys(manualPlacements).length > 0;

    const updatePlacement = (queenId: string, placement: Placement | null) => {
      setManualPlacements(prev => {
        const next = { ...prev };
        if (placement === null) {
          delete next[queenId];
        } else {
          next[queenId] = placement;
        }
        return next;
      });
    };

    const availablePlacements: Placement[] = currentEp.isPremiere
      ? ['TOP2', 'SAFE', 'LOW']
      : ['WIN', 'HIGH', 'SAFE', 'LOW', 'BTM2'];

    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-purple-100">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Drama className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Producer Room</h3>
              <p className="text-xs md:text-sm text-stone-500 font-semibold uppercase tracking-wide">
                Override placements for this episode. Set each queen's result manually.
              </p>
            </div>
          </div>
          <button
            onClick={() => setManualPlacements({})}
            disabled={!hasManualOverrides}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wide transition-colors",
              hasManualOverrides
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            )}
          >
            Clear Overrides
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eligibleQueens.map(q => {
            const selectedPlacement = manualPlacements[q.id];
            // Show mini track record - last 5 episodes
            const pastEpisodes = q.trackRecord.slice(0, currentEpIdx).filter(p => p !== null && p !== 'GUEST');
            const recentRecord = pastEpisodes.slice(-5);

            return (
              <div
                key={q.id}
                className={cn(
                  "p-4 border-2 rounded-2xl bg-gradient-to-br from-white to-stone-50 flex flex-col gap-3 transition-all",
                  selectedPlacement ? "border-purple-400 shadow-lg ring-2 ring-purple-200" : "border-stone-200 hover:border-purple-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <QueenAvatar queen={q} size="sm" className="border-purple-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">{q.name}</p>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-yellow-500"/>{q.wins}
                      </span>
                      <span className="flex items-center gap-1">
                        <Frown className="h-3 w-3 text-red-500"/>{q.bottoms}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cute Mini Track Record */}
                {recentRecord.length > 0 && (
                  <div className="bg-stone-100 rounded-lg p-2">
                    <p className="text-[9px] uppercase font-bold text-stone-400 mb-1.5">Recent Track</p>
                    <div className="flex gap-1 justify-center">
                      {recentRecord.map((placement, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-6 h-6 rounded text-[8px] font-black flex items-center justify-center",
                            getPlaceColor(placement)
                          )}
                          title={placement || ''}
                        >
                          {placement === 'TOP2' ? 'T2' : placement === 'BTM2' ? 'B2' : placement}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Placement Selection */}
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Set Placement</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {availablePlacements.map(placement => (
                      <button
                        key={placement}
                        onClick={() => updatePlacement(q.id, selectedPlacement === placement ? null : placement)}
                        className={cn(
                          "px-2 py-1.5 rounded text-[10px] font-black uppercase transition-all",
                          selectedPlacement === placement
                            ? cn(getPlaceColor(placement), "ring-2 ring-purple-500 scale-105")
                            : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        )}
                      >
                        {placement === 'TOP2' ? 'T2' : placement === 'BTM2' ? 'B2' : placement}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedPlacement && (
                  <div className={cn(
                    "text-center text-xs font-black uppercase py-1.5 rounded-lg",
                    getPlaceColor(selectedPlacement)
                  )}>
                    Override: {selectedPlacement === 'TOP2' ? 'TOP 2' : selectedPlacement === 'BTM2' ? 'BTM 2' : selectedPlacement}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TrackRecordTable = () => {
    // Sort: Active first (by best track record approx), then eliminated reversed.
    const scoreTR = (q: Queen) => (q.wins * 10) - (q.bottoms * 5) + (q.momentum * 2);
    const active = queens.filter(q => q.status !== 'eliminated').sort((a,b) => scoreTR(b) - scoreTR(a));
    const elims = queens.filter(q => q.status === 'eliminated').sort((a,b) => (a.eliminatedEpisode||0) - (b.eliminatedEpisode||0));
    const sorted = [...active, ...elims.reverse()];

    return (
      <div className="overflow-x-auto border rounded-2xl shadow-sm bg-white mt-8">
        <table className="w-full text-xs md:text-sm">
          <thead>
             <tr className="bg-gray-100 text-gray-600 uppercase tracking-wider">
               <th className="p-3 text-left sticky left-0 bg-gray-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Queen</th>
               {EPISODES.map((e, i) => <th key={i} className="p-2 min-w-[40px]">{e.isFinale ? 'FINALE' : i+1}</th>)}
             </tr>
          </thead>
          <tbody>
            {sorted.map(q => (
              <tr key={q.id} className={cn("border-t", q.status === 'winner' && "bg-yellow-50", q.status === 'eliminated' && "bg-gray-50")}>
                <td className={cn("p-3 font-bold sticky left-0 z-10 flex items-center gap-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]", q.status === 'active' ? "bg-white" : q.status === 'winner' ? "bg-yellow-50" : "bg-gray-50") }>
                   <QueenAvatar queen={q} size="sm" className="border-white shadow" />
                   <div className="flex items-center gap-1">
                     {q.status === 'winner' && <Crown className="h-4 w-4 text-yellow-500"/>}
                     <span className="truncate max-w-[100px] md:max-w-none">{q.name}</span>
                   </div>
                </td>
                {q.trackRecord.map((tr, i) => (
                  <td key={i} className="p-1 text-center">
                    <div className={cn("mx-auto w-full max-w-[40px] h-8 flex items-center justify-center rounded font-bold text-[10px]", getPlaceColor(tr))}>
                      {tr === 'TOP2' ? 'T2' : (tr || '-')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  };

  // --- MAIN RENDER --- //
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans pb-24 selection:bg-pink-500 selection:text-white">
      
      {/* TOP NAV */}
      <header className="bg-black text-white py-4 px-6 sticky top-0 z-30 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2 font-black tracking-tighter text-xl md:text-2xl italic bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
          <Flame className="text-pink-500" /> RU-SIMULATOR S12
        </div>
        {gameState !== 'intro' && (
          <div className="text-xs md:text-sm font-bold text-stone-400 uppercase">
             Ep {currentEp.number} <span className="text-white">//</span> {activeQueens.length} Queens Left
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        
        {/* INTRO SCREEN */}
        {gameState === 'intro' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-1000">
            <h1 className="text-6xl md:text-8xl font-black text-center tracking-tighter leading-none">
              START YOUR<br/><span className="text-pink-600">ENGINES</span>
            </h1>
            <button onClick={startSeason} className="bg-black text-white text-xl md:text-2xl px-12 py-6 rounded-full font-black hover:scale-110 hover:bg-pink-600 transition-all shadow-2xl">
              ENTER WERKROOM
            </button>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-12 opacity-80">
               {INITIAL_CAST_DATA.map(q => (
                 <div key={q.id} className="w-10 h-10 rounded-full overflow-hidden border border-white/60 shadow-sm" title={q.name}>
                   <img src={(q.image as string) || createAvatarUrl(q.name!)} alt={`${q.name} avatar preview`} className="w-full h-full object-cover" loading="lazy" />
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* ENTRANCES (EP1 ONLY) */}
        {gameState === 'entrances' && currentEp.number === 1 && (
          <div className="space-y-12 animate-in fade-in zoom-in duration-1000">
            <div className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-3xl p-12 shadow-2xl text-center">
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600">
                ENTRANCES
              </h1>
              <p className="text-xl md:text-2xl font-bold text-stone-700 mb-12">
                The queens make their grand entrance into the werkroom! ✨
              </p>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-8 max-w-5xl mx-auto">
                {queens.map((q, idx) => (
                  <div key={q.id} className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                    <QueenAvatar queen={q} size="lg" className="border-pink-300 shadow-xl" />
                    <p className="text-sm font-bold mt-3 text-center">{q.name}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setGameState('promo_chart')}
                className="mt-12 bg-gradient-to-r from-pink-600 to-purple-600 text-white px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-xl"
              >
                CONTINUE TO PROMO LOOKS
              </button>
            </div>
          </div>
        )}

        {/* PROMO CHART */}
        {gameState === 'promo_chart' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-stone-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
                PROMO LOOKS
              </h2>
              <p className="text-lg text-stone-500 font-medium">
                The queens serve their best promo looks for Season 12!
              </p>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-6">
              {activeQueens.map(q => (
                <div key={q.id} className="flex flex-col items-center gap-2">
                  <QueenAvatar queen={q} size="md" className="border-purple-300 hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-center">{q.name}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setGameState('challenge_announcement')}
              className="w-full bg-black text-white py-6 rounded-2xl font-black text-2xl uppercase hover:bg-pink-600 transition-colors"
            >
              ANNOUNCE THIS WEEK'S CHALLENGE
            </button>
          </div>
        )}

        {/* CHALLENGE ANNOUNCEMENT & MAIN GAME LOOP */}
        {['challenge_announcement', 'challenge_performances', 'results'].includes(gameState) && (
          <div className="space-y-12">

            {/* EPISODE INFO CARD */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-2 border-stone-100 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
               <h2 className="text-4xl font-black uppercase tracking-tight mb-2">{currentEp.title}</h2>
               <p className="text-lg text-stone-500 font-medium max-w-2xl mx-auto">{currentEp.description}</p>
               <div className="flex flex-wrap justify-center gap-2 mt-6">
                 {currentEp.challengeStats.map(s => (
                   <span key={s} className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-bold uppercase rounded-full">{s}</span>
                 ))}
               </div>

               {gameState === 'challenge_announcement' && (
                 <button onClick={runEpisode} className="mt-8 bg-pink-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:bg-pink-700 hover:shadow-lg transition-all animate-bounce">
                   BRING IT TO THE RUNWAY
                 </button>
               )}
               {gameState === 'challenge_performances' && (
                 <div className="mt-8 text-2xl font-black text-pink-500 animate-pulse flex justify-center items-center gap-2">
                   <Sparkles className="animate-spin" /> SERVING LOOKS...
                 </div>
               )}
            </div>

            {gameState === 'challenge_announcement' && (
              <div className="animate-in slide-in-from-bottom-5 duration-500">
                <ProducerRoom />
              </div>
            )}

            {/* WORKROOM (ACTIVE QUEENS) */}
            {['challenge_announcement', 'challenge_performances'].includes(gameState) && (
              <div className="animate-in slide-in-from-bottom-10 duration-700">
                <h3 className="text-xl font-black uppercase text-stone-400 mb-4 ml-2">In The Workroom</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {activeQueens.filter(q => q.trackRecord[currentEpIdx] !== 'GUEST').map(q => (
                    <QueenCard key={q.id} queen={q} />
                  ))}
                </div>
              </div>
            )}

            {/* RESULTS DISPLAY */}
            {gameState === 'results' && (
               <div className="space-y-8 animate-in zoom-in-95 duration-500">
                 {/* SAFE QUEENS - Condensed */}
                 {activeQueens.some(q => placements[q.id] === 'SAFE' && q.trackRecord[currentEpIdx] !== 'GUEST') && (
                   <div className="bg-stone-200/50 p-6 rounded-2xl">
                      <h3 className="text-stone-500 font-bold uppercase mb-4 flex items-center gap-2"><Meh/> Safe</h3>
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {activeQueens.filter(q => placements[q.id] === 'SAFE' && q.trackRecord[currentEpIdx] !== 'GUEST').map(q => (
                          <QueenCard key={q.id} queen={q} mini />
                        ))}
                      </div>
                   </div>
                 )}

                 {/* TOPS & BOTTOMS */}
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100">
                      <h3 className="text-green-700 font-bold uppercase mb-4 flex items-center gap-2"><Star className="fill-green-600"/> Tops</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {activeQueens.filter(q => ['WIN','TOP2','HIGH'].includes(placements[q.id]||'')).map(q => <QueenCard key={q.id} queen={q} />)}
                      </div>
                    </div>
                    <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100">
                      <h3 className="text-red-700 font-bold uppercase mb-4 flex items-center gap-2"><Frown className="fill-red-600"/> Bottoms</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {activeQueens.filter(q => ['LOW','BTM2'].includes(placements[q.id]||'')).map(q => <QueenCard key={q.id} queen={q} />)}
                      </div>
                    </div>
                 </div>

                 {!currentEp.isFinale && (
                   <button onClick={() => setGameState('lipsync_reveal')} className="w-full py-6 bg-black text-white font-black text-2xl uppercase rounded-2xl hover:bg-red-600 transition-colors animate-pulse">
                     {currentEp.isPremiere ? "ANNOUNCE WINNER" : "LIP SYNC FOR YOUR LIFE"}
                   </button>
                 )}
               </div>
            )}

            {/* LIPSYNC ARENA */}
            {['lipsync_reveal', 'lipsync_ongoing'].includes(gameState) && (
               <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
                  <h2 className="text-3xl md:text-5xl font-black text-red-600 uppercase mb-12 animate-pulse">
                    {currentEp.isPremiere ? "Lip Sync For The Win" : "Lip Sync For Your Life"}
                  </h2>
                  <div className="flex items-center gap-8 md:gap-16">
                     <div className="text-center">
                       <QueenAvatar
                         queen={currentEp.isPremiere ? top2[0] : lipsyncers[0]}
                         size="xl"
                         className="border-red-500 shadow-[0_0_25px_rgba(248,113,113,0.45)]"
                       />
                       <h3 className="mt-4 text-xl md:text-3xl font-bold">{currentEp.isPremiere ? top2[0]?.name : lipsyncers[0]?.name}</h3>
                     </div>
                     <div className="text-4xl md:text-6xl font-black text-stone-600 italic">VS</div>
                     <div className="text-center">
                       <QueenAvatar
                         queen={currentEp.isPremiere ? top2[1] : lipsyncers[1]}
                         size="xl"
                         className="border-red-500 shadow-[0_0_25px_rgba(248,113,113,0.45)]"
                       />
                       <h3 className="mt-4 text-xl md:text-3xl font-bold">{currentEp.isPremiere ? top2[1]?.name : lipsyncers[1]?.name}</h3>
                     </div>
                  </div>
                  
                  {gameState === 'lipsync_reveal' ? (
                    <button onClick={runLipsync} className="mt-16 px-12 py-4 bg-white text-black text-xl font-black rounded-full hover:scale-105 transition-transform">
                      GOOD LUCK, AND DON'T F*CK IT UP
                    </button>
                  ) : (
                    <div className="mt-16 text-2xl font-black text-red-500 animate-bounce">
                      <Mic className="inline-block mr-2" /> PERFORMING...
                    </div>
                  )}
               </div>
            )}

            {/* ELIMINATION REVEAL MODAL */}
            {gameState === 'elimination' && (
               <div className="fixed inset-0 z-50 bg-red-950/95 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in duration-500">
                  {doubleSashayUsed && eliminated && eliminated2 ? (
                     <>
                      <Skull className="w-24 h-24 text-red-500 mb-4" />
                      <h2 className="text-6xl font-black uppercase text-red-500 mb-4">DOUBLE SASHAY</h2>
                      <p className="text-2xl md:text-4xl font-bold">{eliminated.name} &amp; {eliminated2.name}</p>
                      <div className="flex items-center justify-center gap-6 mt-8">
                        <QueenAvatar queen={eliminated} size="lg" className="border-red-400" />
                        <QueenAvatar queen={eliminated2} size="lg" className="border-red-400" />
                      </div>
                     </>
                  ) : (
                     <>
                      <h2 className="text-4xl font-bold opacity-50 mb-2">Sashay Away...</h2>
                      <h1 className="text-7xl md:text-9xl font-black text-red-500 tracking-tighter leading-none">{eliminated?.name}</h1>
                      {eliminated && (
                        <div className="mt-10">
                          <QueenAvatar queen={eliminated} size="lg" className="border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.35)]" />
                        </div>
                      )}
                     </>
                  )}
                  <button onClick={() => setGameState('untucked')} className="mt-16 px-8 py-3 border-2 border-white rounded-full font-bold hover:bg-white hover:text-red-950 transition-colors">
                    CONTINUE TO UNTUCKED
                  </button>
               </div>
            )}

          </div>
        )}

        {/* UNTUCKED STAGE */}
        {gameState === 'untucked' && (
          <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-500">
            <div className="max-w-3xl w-full bg-black/40 backdrop-blur-md rounded-3xl p-8 md:p-12 border-2 border-pink-500/30 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Heart className="h-10 w-10 text-pink-400 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">UNTUCKED</h2>
                <Heart className="h-10 w-10 text-pink-400 animate-pulse" />
              </div>

              {currentStoryline && (
                <div className="bg-pink-500/20 border-2 border-pink-400/40 rounded-2xl p-6 mb-8">
                  <p className="text-lg md:text-xl font-bold text-center leading-relaxed">
                    {currentStoryline}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                <p className="text-center text-xl font-bold text-pink-300">
                  The queens spill tea backstage...
                </p>

                {/* Show remaining queens */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-w-2xl mx-auto">
                  {activeQueens.slice(0, 8).map(q => (
                    <div key={q.id} className="flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                      <QueenAvatar queen={q} size="sm" className="border-pink-400" />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={nextEpisode}
                className="mt-10 w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white px-8 py-5 rounded-xl font-black text-xl uppercase hover:scale-105 transition-transform shadow-lg"
              >
                NEXT EPISODE
              </button>
            </div>
          </div>
        )}

        {/* FINALE SEQUENCE */}
        {gameState === 'finale_moment' && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
             <h1 className="text-white text-4xl md:text-6xl font-black animate-pulse text-center">
                THE CROWD IS GOING WILD...
             </h1>
          </div>
        )}

        {gameState === 'finale_crowned' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in zoom-in duration-1000">
             <Crown className="w-32 h-32 text-yellow-400 animate-bounce filter drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]" />
             <h2 className="text-2xl md:text-4xl font-bold text-stone-500">AMERICA'S NEXT DRAG SUPERSTAR IS</h2>
             <h1 className="text-6xl md:text-9xl font-black bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 bg-clip-text text-transparent tracking-tighter leading-none">
               {queens.find(q => q.status === 'winner')?.name.toUpperCase()}
             </h1>
             <button onClick={() => window.location.reload()} className="mt-12 bg-black text-white px-8 py-3 rounded-full font-bold">START NEW SEASON</button>
          </div>
        )}

        {/* ALWAYS VISIBLE TRACK RECORD (unless Intro) */}
        {gameState !== 'intro' && <TrackRecordTable />}

      </main>
    </div>
  );
}
