import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Trophy, Skull, Sparkles, Crown, Mic, Shirt, Palette, Music, Drama, Star, RefreshCcw, Play, Gavel, HeartCrack, Flame, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Constants ---

type StatKey = 'acting' | 'improv' | 'comedy' | 'dance' | 'design' | 'singing' | 'runway' | 'lipsync' | 'branding' | 'charisma' | 'makeover';
type ChallengeType = 'design' | 'acting' | 'comedy' | 'improv' | 'musical' | 'dance' | 'branding' | 'makeover' | 'ball' | 'snatch' | 'rumix' | 'finale';
type Placement = 'WIN' | 'HIGH' | 'SAFE' | 'LOW' | 'BTM2' | 'ELIM' | 'WINNER' | 'RUNNER-UP' | 'TOP4' | 'SAVE' | null;

interface Queen {
  id: string;
  name: string;
  archetype: string;
  stats: Record<StatKey, number>;
  trackRecord: Placement[];
  active: boolean;
  eliminatedAt: number | null;
  ppe: number;
  wins: number;
  btm2s: number;
  narrativeBuff: number; // Carries over week-to-week based on storylines
}

interface Challenge {
  type: ChallengeType;
  name: string;
  description: string;
  primaryStats: StatKey[];
}

const SEASON_TEMPLATE: Challenge[] = [
  { type: 'design', name: 'Ru-Pocalypse Then', description: 'Create post-apocalyptic couture from drag wreckage.', primaryStats: ['design', 'runway'] },
  { type: 'acting', name: 'Daytona Winds', description: 'Overact in a soapy, windy dynasty spoof.', primaryStats: ['acting', 'charisma'] },
  { type: 'ball', name: 'The Ball Ball', description: 'Serve 3 looks, including one made of literal balls.', primaryStats: ['design', 'runway'] },
  { type: 'improv', name: 'Bossy Rossy', description: 'Improvise wild storylines on a trashy talk show.', primaryStats: ['improv', 'comedy'] },
  { type: 'musical', name: 'Moulin Ru', description: 'Perform in a tragically glamorous jukebox musical.', primaryStats: ['dance', 'singing', 'acting'] },
  { type: 'snatch', name: 'Snatch Game', description: 'Celebrity impersonation improv challenge.', primaryStats: ['comedy', 'improv'] },
  { type: 'design', name: 'Glamazonian Airways', description: 'Design jet-set elegance from unconventional materials.', primaryStats: ['design', 'branding'] },
  { type: 'comedy', name: 'The Roast of RuPaul', description: 'Roast the judges without getting blocked.', primaryStats: ['comedy', 'charisma'] },
  { type: 'branding', name: 'DragCon Panels', description: 'Host an engaging and marketable panel discussion.', primaryStats: ['branding', 'charisma'] },
  { type: 'makeover', name: 'Superfan Makeover', description: 'Transform a superfan into your drag daughter.', primaryStats: ['makeover', 'runway'] },
];

const DRAG_NAMES_FIRST = ['Crystal', 'Divine', 'Ruby', 'Gigi', 'Karma', 'Lola', 'Venus', 'Roxy', 'Mistress', 'Sasha', 'Coco', 'Alaska', 'Trinity', 'Jasmine', 'Pearl', 'Raven', 'Ivy', 'Scarlet', 'Aurora', 'Elektra', 'Luxx', 'Anetra', 'Kandy', 'Symone', 'Gottmik', 'Ros e9', 'Bianca', 'Adore', 'Courtney', 'BenDeLa', 'Katya', 'Trixie', 'Shea', 'Jaida'];
const DRAG_NAMES_LAST = ['Methyd', 'St. James', 'Coule e9', 'Bonina', 'O\'Hara', 'Visage', 'Moon', 'Muse', 'DeVille', 'Mattel', 'Thunderfuck', 'Zamorodchikova', 'Monsoon', 'Del Rio', 'Hall', 'Michaels', 'Davenport', 'Edwards', 'Vangie', 'Noir', 'Knox', 'Colby', 'Iman', 'Diamond', 'Creme', 'Act', 'Delano', 'Essence Hall'];

const ARCHETYPES = {
  'Comedy Queen': { high: ['comedy', 'improv', 'acting', 'charisma'], low: ['design', 'runway'] },
  'Fashion Queen': { high: ['design', 'runway', 'makeover', 'branding'], low: ['comedy', 'improv', 'acting'] },
  'Lipsync Assassin': { high: ['dance', 'lipsync', 'charisma'], low: ['branding', 'design', 'acting'] },
  'Theater Queen': { high: ['singing', 'acting', 'dance', 'improv'], low: ['makeover', 'design'] },
  'Pageant Queen': { high: ['runway', 'makeover', 'branding'], low: ['comedy', 'improv'] },
  'Jack of All Trades': { high: ['charisma', 'acting', 'design'], low: [] }
};

const roll = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const generateQueen = (id: number): Queen => {
  const firstName = DRAG_NAMES_FIRST[roll(0, DRAG_NAMES_FIRST.length - 1)];
  const lastName = DRAG_NAMES_LAST[roll(0, DRAG_NAMES_LAST.length - 1)];
  const archKeys = Object.keys(ARCHETYPES);
  const archetypeStr = archKeys[roll(0, archKeys.length - 1)] as keyof typeof ARCHETYPES;
  const arch = ARCHETYPES[archetypeStr];
  const stats: Record<StatKey, number> = {
    acting: roll(6, 16), improv: roll(6, 16), comedy: roll(6, 16), dance: roll(6, 16),
    design: roll(6, 16), singing: roll(6, 16), runway: roll(6, 16), lipsync: roll(6, 16),
    branding: roll(6, 16), charisma: roll(6, 16), makeover: roll(6, 16),
  };
  arch.high.forEach(s => stats[s as StatKey] = clamp(stats[s as StatKey] + roll(4, 7), 1, 20));
  arch.low.forEach(s => stats[s as StatKey] = clamp(stats[s as StatKey] - roll(3, 6), 1, 20));

  return { id: `queen-${id}`, name: `${firstName} ${lastName}`, archetype: archetypeStr, stats, trackRecord: [], active: true, eliminatedAt: null, ppe: 0, wins: 0, btm2s: 0, narrativeBuff: 0 };
};

const getPlacementScore = (p: Placement): number => {
  switch (p) {
    case 'WINNER': return 10; case 'WIN': return 5; case 'HIGH': return 4;
    case 'SAFE': return 3; case 'SAVE': return 2; case 'LOW': return 1;
    default: return 0;
  }
};

const updateQueenStats = (queen: Queen, narrativeShift: number = 0): Queen => {
  const validPlacements = queen.trackRecord.filter(p => p !== null && !['WINNER', 'RUNNER-UP', 'TOP4'].includes(p as string));
  const wins = queen.trackRecord.filter(p => p === 'WIN').length;
  const btm2s = queen.trackRecord.filter(p => p === 'BTM2' || p === 'ELIM').length;
  const ppe = validPlacements.length === 0 ? 0 : validPlacements.reduce((acc, p) => acc + getPlacementScore(p), 0) / validPlacements.length;
  return { ...queen, ppe, wins, btm2s, narrativeBuff: queen.narrativeBuff + narrativeShift };
};

// --- Main Component ---

export default function DragRaceSimGagworthy() {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'finale' | 'finished'>('setup');
  const [queens, setQueens] = useState<Queen[]>([]);
  const [week, setWeek] = useState(0);
  const [logs, setLogs] = useState<{ week: number | string, text: string, type?: 'elim' | 'win' | 'tea' | 'save' }[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'challenge' | 'judging_safes' | 'judging_final' | 'lipsync'>('challenge');
  const [doubleShantayUsed, setDoubleShantayUsed] = useState(false);
  const [dramaticMoment, setDramaticMoment] = useState<{ show: boolean; type: 'WIN' | 'ELIM' | 'DOUBLE_SHANTAY' | 'FINALE_WIN' | null; queen1?: Queen; queen2?: Queen; text?: string; }>({ show: false, type: null });
  const logRef = useRef<HTMLDivElement>(null);

  const [episode, setEpisode] = useState<{ 
      challenge: Challenge | null; 
      scores: { id: string, total: number }[]; 
      placements: Record<string, Placement>; 
      bottomTwo: Queen[]; 
      safeQueens: Queen[];
      critiquedQueens: Queen[];
  }>({ challenge: null, scores: [], placements: {}, bottomTwo: [], safeQueens: [], critiquedQueens: [] });
  
  const [finaleBracket, setFinaleBracket] = useState<{ semi1: { q1: Queen | null, q2: Queen | null, winner: Queen | null }; semi2: { q1: Queen | null, q2: Queen | null, winner: Queen | null }; final: { q1: Queen | null, q2: Queen | null, winner: Queen | null }; phase: 'semi1' | 'semi2' | 'final' | 'crowning'; }>({ semi1: {q1:null, q2:null, winner:null}, semi2: {q1:null, q2:null, winner:null}, final: {q1:null, q2:null, winner:null}, phase: 'semi1' });

  const activeQueens = useMemo(() => queens.filter(q => q.active), [queens]);
  
  // --- SORTING FOR TRACK RECORD TABLE ---
  const sortedQueensForTable = useMemo(() => {
      return [...queens].sort((a, b) => {
          if (a.active && !b.active) return -1;
          if (!a.active && b.active) return 1;
          if (!a.active && !b.active) return (b.eliminatedAt || 0) - (a.eliminatedAt || 0); // Last eliminated higher
          // If Finale happened, sort Winner > Runner Up
          if (gameState === 'finished') {
             const getFinishScore = (q: Queen) => q.trackRecord.includes('WINNER') ? 100 : q.trackRecord.includes('RUNNER-UP') ? 50 : 0;
             return getFinishScore(b) - getFinishScore(a) || b.ppe - a.ppe;
          }
          return b.ppe - a.ppe;
      });
  }, [queens, gameState]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  useEffect(() => { if (dramaticMoment.show) { const t = setTimeout(() => setDramaticMoment(p => ({ ...p, show: false })), dramaticMoment.type === 'DOUBLE_SHANTAY' ? 4000 : 2500); return () => clearTimeout(t); } }, [dramaticMoment.show]);

  const addLog = (w: number | string, text: string, type?: 'elim' | 'win' | 'tea' | 'save') => setLogs(prev => [...prev, { week: w, text, type }]);

  const startSeason = () => {
    const cast = Array.from({ length: 14 }, (_, i) => generateQueen(i + 1));
    setQueens(cast); setWeek(0); setLogs([]); setDoubleShantayUsed(false); setGameState('playing');
    nextEpisode(0, cast);
  };

  const nextEpisode = (weekNum: number, currentCast: Queen[]) => {
    const activeCount = currentCast.filter(q => q.active).length;
    if (activeCount <= 4) { setupFinale(currentCast); return; }
    const challenge = SEASON_TEMPLATE[Math.min(weekNum, SEASON_TEMPLATE.length - 1)];
    setEpisode({ challenge, scores: [], placements: {}, bottomTwo: [], safeQueens: [], critiquedQueens: [] }); 
    setCurrentPhase('challenge');
    addLog(weekNum + 1, `The Top ${activeCount} enter the werkroom for the ${challenge.name}.`);
  };

  const runChallenge = () => {
    if (!episode.challenge) return;
    const ch = episode.challenge;
    let scores = activeQueens.map(q => {
      let raw = ch.primaryStats.reduce((acc, stat) => acc + q.stats[stat], 0) / ch.primaryStats.length;
      let mod = roll(-2, 2) + q.narrativeBuff; // Apply carried over buff
      
      // Archetype Boost
      if (ch.primaryStats.some(stat => ARCHETYPES[q.archetype as keyof typeof ARCHETYPES].high.includes(stat))) mod += 3;
      
      return { id: q.id, total: raw + mod };
    });
    scores.sort((a, b) => b.total - a.total);

    // Strict Placement Logic immediately calculated but hidden
    const newPlacements: Record<string, Placement> = {};
    scores.forEach(s => newPlacements[s.id] = 'SAFE');
    const count = scores.length;
    if (count === 5) {
       newPlacements[scores[0].id] = 'WIN'; newPlacements[scores[1].id] = 'HIGH'; newPlacements[scores[2].id] = 'HIGH';
       newPlacements[scores[3].id] = 'BTM2'; newPlacements[scores[4].id] = 'BTM2';
    } else if (count >= 6) {
       newPlacements[scores[0].id] = 'WIN'; newPlacements[scores[1].id] = 'HIGH'; newPlacements[scores[2].id] = 'HIGH';
       newPlacements[scores[count - 3].id] = 'LOW'; newPlacements[scores[count - 2].id] = 'BTM2'; newPlacements[scores[count - 1].id] = 'BTM2';
    }
    
    // Win Cap & Distribution Narrative Logic
    let winId = scores[0].id;
    let winner = queens.find(q => q.id === winId)!;
    // If already 3 wins by week 6, maybe someone else edges them out for narrative balance
    if (winner.wins >= 3 && week < 7 && roll(1, 10) > 7) {
        const newWinId = scores[1].id;
        newPlacements[winId] = 'HIGH'; newPlacements[newWinId] = 'WIN';
        addLog(week + 1, `Judges felt ${winner.name} was great, but wanted to spread the wealth to ${queens.find(q => q.id === newWinId)?.name}.`, 'tea');
    }

    const safes = activeQueens.filter(q => newPlacements[q.id] === 'SAFE');
    const critiqued = activeQueens.filter(q => newPlacements[q.id] !== 'SAFE').sort((a,b) => scores.find(s => s.id === b.id)!.total - scores.find(s => s.id === a.id)!.total);

    setEpisode(p => ({ ...p, scores, placements: newPlacements, safeQueens: safes, critiquedQueens: critiqued })); 
    setCurrentPhase('judging_safes');
  };

  const declareSafes = () => {
      if (episode.safeQueens.length > 0) {
          addLog(week + 1, `RuPaul declares ${episode.safeQueens.map(q => q.name).join(', ')} as SAFE.`);
      }
      setCurrentPhase('judging_final');
  }

  const revealPlacements = () => {
    const { placements, scores } = episode;
    const winId = Object.keys(placements).find(id => placements[id] === 'WIN');
    const btmIds = Object.keys(placements).filter(id => placements[id] === 'BTM2');
    const winQueen = queens.find(q => q.id === winId)!;
    const btmQueens = btmIds.map(id => queens.find(q => q.id === id)!);

    setDramaticMoment({ show: true, type: 'WIN', queen1: winQueen, text: `Winner of ${episode.challenge?.name}` });
    addLog(week + 1, `CONDRAULATIONS ${winQueen.name}, you are the winner of this week's challenge!`, 'win');
    
    setTimeout(() => {
        addLog(week + 1, `${btmQueens[0].name} and ${btmQueens[1].name}, I'm sorry my dears but you are up for elimination.`, 'elim');
        setEpisode(p => ({ ...p, bottomTwo: btmQueens })); 
        setCurrentPhase('lipsync');
    }, 2000);
  };

  const runLipsync = () => {
    const [q1, q2] = episode.bottomTwo;
    const p1 = q1.stats.lipsync + roll(-1, 6); const p2 = q2.stats.lipsync + roll(-1, 6);
    
    // Riggory: Protect frontrunners heavily on FIRST bottom
    let rig1 = (q1.wins > 0 && q1.btm2s === 0) ? q1.wins * 5 : 0;
    let rig2 = (q2.wins > 0 && q2.btm2s === 0) ? q2.wins * 5 : 0;
    const f1 = p1 + rig1; const f2 = p2 + rig2;

    // Aggressive Double Shantay: Mid-season, no double yet, and either both slayed OR both are deemed "too valuable" (high PPE)
    let isDouble = false;
    if (!doubleShantayUsed && week >= 4 && week <= 9) {
         if ((f1 > 15 && f2 > 15) || (q1.ppe > 3.2 && q2.ppe > 3.2 && Math.abs(f1 - f2) < 3)) {
             isDouble = true;
         }
    }

    if (isDouble) {
        setDoubleShantayUsed(true);
        setDramaticMoment({ show: true, type: 'DOUBLE_SHANTAY', queen1: q1, queen2: q2, text: "Shantay you BOTH stay!" });
        addLog(week + 1, `RuPaul declares a DOUBLE SHANTAY! ${q1.name} and ${q2.name} are saved!`, 'save');
        // Both get a massive "near death experience" buff for next week
        const updated = queens.map(q => (q.id === q1.id || q.id === q2.id) ? updateQueenStats({ ...q, narrativeBuff: 5, trackRecord: [...q.trackRecord, 'SAVE'] }) : (!q.active ? q : updateQueenStats({ ...q, narrativeBuff: 0, trackRecord: [...q.trackRecord, episode.placements[q.id] || 'SAFE'] })));
        setQueens(updated); setWeek(w => w + 1); setTimeout(() => nextEpisode(week + 1, updated), 4500); return;
    }

    const loser = f1 >= f2 ? q2 : q1; const winner = f1 >= f2 ? q1 : q2;
    if ((p1 > p2 && loser.id === q1.id) || (p2 > p1 && loser.id === q2.id)) addLog(week + 1, `The lipsync was rigged! Ru saved ${winner.name} due to her track record.`, 'tea');

    setDramaticMoment({ show: true, type: 'ELIM', queen1: loser, text: "Sashay Away..." });
    addLog(week + 1, `${winner.name}, shantay you stay. ${loser.name}, sashay away.`, 'elim');

    const updated = queens.map(q => {
      if (!q.active) return { ...q, trackRecord: [...q.trackRecord, null] };
      if (q.id === loser.id) return updateQueenStats({ ...q, active: false, eliminatedAt: week + 1, trackRecord: [...q.trackRecord, 'ELIM'] });
      // Narrative Buffs for next week: Winner gets momentum (+2), Bottom survivor gets redemption fire (+4), SAFEs get nothing (0)
      let nextBuff = 0;
      if (q.id === winner.id) nextBuff = 4;
      else if (episode.placements[q.id] === 'WIN') nextBuff = 2;
      else if (episode.placements[q.id] === 'HIGH') nextBuff = 1;
      else if (episode.placements[q.id] === 'LOW') nextBuff = 3; // Wake up call
      
      return updateQueenStats({ ...q, narrativeBuff: nextBuff, trackRecord: [...q.trackRecord, episode.placements[q.id] || 'SAFE'] });
    });
    setQueens(updated); setWeek(w => w + 1); setTimeout(() => nextEpisode(week + 1, updated), 3000);
  };

  const setupFinale = (finalQueens: Queen[]) => {
    setGameState('finale');
    const top4 = finalQueens.filter(q => q.active).sort((a,b) => b.ppe - a.ppe);
    setQueens(p => p.map(q => q.active ? { ...q, trackRecord: [...q.trackRecord, 'TOP4'] } : { ...q, trackRecord: [...q.trackRecord, null] }));
    setFinaleBracket({ semi1: { q1: top4[0], q2: top4[3], winner: null }, semi2: { q1: top4[1], q2: top4[2], winner: null }, final: { q1: null, q2: null, winner: null }, phase: 'semi1' });
    addLog('FINALE', `Welcome to the Grand Finale! It's time for a Lip Sync For The Crown!`);
  };

  const runFinalePhase = () => {
    const { phase, semi1, semi2, final } = finaleBracket;
    // Finale uses "Storyline Score" heavily: PPE * 3 + Lipsync Stat + small RNG. Hard for a pure track record bomb to win unless they are a GOD tier lipsyncer.
    const resolve = (q1: Queen, q2: Queen) => (q1.stats.lipsync + roll(0,5) + (q1.ppe * 3)) >= (q2.stats.lipsync + roll(0,5) + (q2.ppe * 3)) ? q1 : q2;

    if (phase === 'semi1' && semi1.q1 && semi1.q2) {
        const w = resolve(semi1.q1, semi1.q2);
        setFinaleBracket(p => ({ ...p, semi1: { ...p.semi1, winner: w }, phase: 'semi2' }));
        addLog('FINALE', `${semi1.q1.name} vs ${semi1.q2.name}... ${w.name} advances!`);
    } else if (phase === 'semi2' && semi2.q1 && semi2.q2) {
        const w = resolve(semi2.q1, semi2.q2);
        setFinaleBracket(p => ({ ...p, semi2: { ...p.semi2, winner: w }, final: { q1: semi1.winner, q2: w, winner: null }, phase: 'final' }));
        addLog('FINALE', `${semi2.q1.name} vs ${semi2.q2.name}... ${w.name} advances!`);
    } else if (phase === 'final' && final.q1 && final.q2) {
        const w = resolve(final.q1, final.q2);
        setFinaleBracket(p => ({ ...p, final: { ...p.final, winner: w }, phase: 'crowning' }));
        setDramaticMoment({ show: true, type: 'FINALE_WIN', queen1: w, text: "AMERICA'S NEXT DRAG SUPERSTAR" });
        addLog('FINALE', `The winner of RuPaul's Drag Race is... ${w.name}!!!`, 'win');
        setQueens(p => p.map(q => (q.id === w.id ? { ...q, trackRecord: [...q.trackRecord, 'WINNER'] } : (q.active && q.id !== w.id ? { ...q, trackRecord: [...q.trackRecord, 'RUNNER-UP'] } : { ...q, trackRecord: [...q.trackRecord, null] }))));
        setGameState('finished');
    }
  };

  const DramaticOverlay = () => {
      if (!dramaticMoment.show) return null;
      const { type, queen1, queen2, text } = dramaticMoment;
      return (
          <div className={cn("fixed inset-0 z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-200 p-8 text-center backdrop-blur-sm", 
              type === 'ELIM' ? 'bg-red-950/90' : type === 'WIN' ? 'bg-pink-600/90' : 'bg-amber-500/90')}>
              {type === 'ELIM' ? <HeartCrack className="w-40 h-40 mb-4 text-red-500 animate-pulse drop-shadow-[0_0_25px_rgba(239,68,68,0.8)]" /> : 
               type === 'DOUBLE_SHANTAY' ? <Sparkles className="w-40 h-40 mb-4 text-white animate-spin-slow drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]" /> :
               <Crown className="w-40 h-40 mb-4 text-yellow-300 animate-bounce drop-shadow-[0_0_25px_rgba(253,224,71,0.8)]" />}
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter drop-shadow-2xl mb-6 leading-none">
                  {type === 'DOUBLE_SHANTAY' ? <>{queen1?.name}<br/><span className="text-4xl italic text-yellow-200">&</span><br/>{queen2?.name}</> : queen1?.name}
              </h2>
              <p className="text-3xl md:text-5xl font-extrabold bg-black/50 px-8 py-4 rounded-full border-4 border-white/20 transform -rotate-2">{text}</p>
          </div>
      );
  };

  const renderTrackRecord = () => (
    <div className="mt-6 overflow-x-auto border-2 border-pink-900/10 rounded-xl shadow-lg bg-white">
      <table className="min-w-full text-xs">
        <thead className="bg-pink-600 text-white uppercase tracking-wider">
          <tr>
            <th className="p-3 text-left sticky left-0 bg-pink-700 z-10 shadow-md">Queen</th>
            {Array.from({ length: Math.max(week, 1) }).map((_, i) => <th key={i} className="p-2 text-center w-10 border-l border-pink-500">E{i+1}</th>)}
            <th className="p-2 text-center w-14 font-bold border-l border-pink-500">PPE</th>
          </tr>
        </thead>
        <tbody>
          {sortedQueensForTable.map(q => (
            <tr key={q.id} className={cn("border-t border-pink-100 transition-colors hover:bg-pink-50", !q.active && "bg-gray-100 text-gray-500")}>
              <td className={cn("p-2 font-bold sticky left-0 z-10 flex items-center gap-2 whitespace-nowrap border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]", q.active ? "bg-white" : "bg-gray-100")}>
                 {q.trackRecord.includes('WINNER') && <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                 {q.name}
              </td>
              {q.trackRecord.map((p, i) => (
                <td key={i} className="p-1"><div className={cn("w-full h-8 flex items-center justify-center rounded-md font-black text-[11px] shadow-sm",
                    p === 'WIN' && "bg-blue-500 text-white", p === 'WINNER' && "bg-yellow-400 text-pink-900",
                    p === 'HIGH' && "bg-green-400 text-green-950", p === 'SAFE' && "bg-yellow-100 text-yellow-800",
                    p === 'LOW' && "bg-orange-300 text-orange-950", p === 'BTM2' && "bg-red-500 text-white",
                    p === 'ELIM' && "bg-red-950 text-white", p === 'RUNNER-UP' && "bg-slate-400 text-white",
                    p === 'TOP4' && "bg-purple-300 text-purple-900", p === 'SAVE' && "bg-amber-400 text-amber-950",
                    p === null && "bg-gray-200"
                  )}>{p === 'BTM2' ? 'BTM' : p === 'WINNER' ? 'WIN' : p}</div></td>
              ))}
              {Array.from({ length: Math.max(0, week - q.trackRecord.length) }).map((_, i) => <td key={`f${i}`} className="p-1"><div className="w-full h-8 bg-gray-100 rounded-md opacity-50"/></td>)}
              <td className="p-2 text-center font-bold text-sm">{q.ppe.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-pink-50 text-gray-900 font-sans pb-12">
      <DramaticOverlay />
      <header className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 text-white py-3 px-6 sticky top-0 z-30 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-black flex items-center gap-2 tracking-tighter italic"><Crown className="w-6 h-6" /> DRAG RACE SIMULATOR</h1>
        {gameState !== 'setup' && <button onClick={() => setGameState('setup')} className="text-xs font-bold bg-white/20 hover:bg-white/40 px-3 py-1 rounded-full flex items-center gap-1 transition-all"><RefreshCcw className="w-3 h-3" /> RESTART SEASON</button>}
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {gameState === 'setup' ? (
          <div className="col-span-12 flex flex-col items-center justify-center py-20 space-y-8 text-center">
             <div className="relative">
                 <div className="absolute inset-0 bg-pink-500 blur-3xl opacity-20 animate-pulse"></div>
                 <Crown className="w-32 h-32 text-pink-600 relative z-10" />
             </div>
             <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 leading-tight">START YOUR<br/>ENGINES</h2>
             <p className="text-2xl text-gray-700 max-w-2xl font-medium">Experience organic storylines, shocking eliminations, and gag-worthy twists in the ultimate Drag Race simulator.</p>
             <button onClick={startSeason} className="px-12 py-6 bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-500 hover:to-purple-600 text-white font-black rounded-full shadow-2xl hover:scale-110 transition-all text-2xl flex items-center gap-3"><Sparkles className="w-6 h-6"/> BEGIN SEASON</button>
          </div>
        ) : (
          <>
            <div className="lg:col-span-7 space-y-6">
              {/* ACTIVE EPISODE CARD */}
              {gameState === 'playing' && episode.challenge && (
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-500 relative ring-4 ring-pink-200">
                  <div className="bg-gradient-to-r from-pink-700 via-purple-800 to-pink-700 p-6 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="bg-pink-950/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Week {week + 1}</span>
                            <span className="font-bold flex items-center gap-1"><Star className="w-4 h-4 fill-current"/> {activeQueens.length} Queens</span>
                        </div>
                        <h2 className="text-4xl font-black uppercase italic tracking-tight">{episode.challenge.name}</h2>
                        <p className="opacity-90 mt-2 text-lg font-medium">{episode.challenge.description}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center min-h-[250px]">
                      {currentPhase === 'challenge' && (
                        <button onClick={runChallenge} className="w-full py-6 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black rounded-2xl text-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform transition-all hover:-translate-y-1">
                            <Play className="w-8 h-8" /> RUN THE CHALLENGE
                        </button>
                      )}
                      {currentPhase === 'judging_safes' && (
                          <div className="text-center w-full space-y-6 animate-in zoom-in">
                              <h3 className="text-2xl font-bold text-pink-900">The queens have walked the runway.</h3>
                              <p className="text-gray-600">It's time to find out who is safe, and who is up for critique.</p>
                              <button onClick={declareSafes} className="px-8 py-4 bg-gray-800 hover:bg-black text-white font-bold rounded-xl mx-auto flex items-center gap-2"><Gavel className="w-5 h-5"/> CALL THE SAFE QUEENS</button>
                          </div>
                      )}
                      {currentPhase === 'judging_final' && (
                          <div className="w-full space-y-4 animate-in slide-in-from-bottom fade-in">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                  {episode.critiquedQueens.map(q => (
                                      <div key={q.id} className="bg-white border-2 border-purple-200 p-3 rounded-lg text-center font-bold text-purple-900 shadow-sm">
                                          {q.name}
                                      </div>
                                  ))}
                              </div>
                              <p className="text-center font-bold text-lg text-purple-900 italic">Representing the tops and bottoms of the week.</p>
                              <button onClick={revealPlacements} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xl flex items-center justify-center gap-2 shadow-md">
                                  REVEAL FINAL JUDGMENT
                              </button>
                          </div>
                      )}
                      {currentPhase === 'lipsync' && episode.bottomTwo.length === 2 && (
                        <div className="w-full space-y-6 animate-in shake">
                           <div className="flex justify-between items-center bg-red-50 p-6 rounded-2xl shadow-inner border-2 border-red-200">
                              <div className="text-center flex-1 transform hover:scale-105 transition-transform">
                                  <div className="w-20 h-20 bg-red-200 rounded-full mx-auto mb-2 flex items-center justify-center border-4 border-red-500"><Skull className="w-10 h-10 text-red-600"/></div>
                                  <p className="font-black text-red-900 text-xl leading-none">{episode.bottomTwo[0].name}</p>
                                  <p className="text-sm font-bold text-red-400">LIPSYNC: {episode.bottomTwo[0].stats.lipsync}</p>
                              </div>
                              <div className="font-black text-red-300 text-2xl px-4 italic">VS</div>
                              <div className="text-center flex-1 transform hover:scale-105 transition-transform">
                                  <div className="w-20 h-20 bg-red-200 rounded-full mx-auto mb-2 flex items-center justify-center border-4 border-red-500"><Skull className="w-10 h-10 text-red-600"/></div>
                                  <p className="font-black text-red-900 text-xl leading-none">{episode.bottomTwo[1].name}</p>
                                  <p className="text-sm font-bold text-red-400">LIPSYNC: {episode.bottomTwo[1].stats.lipsync}</p>
                              </div>
                           </div>
                           <button onClick={runLipsync} className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-2xl flex items-center justify-center gap-3 animate-pulse shadow-lg shadow-red-500/30">
                               <Mic className="w-8 h-8" /> LIP SYNC FOR YOUR LIFE
                           </button>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* FINALE TOURNAMENT */}
              {(gameState === 'finale' || gameState === 'finished') && (
                <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 rounded-3xl shadow-2xl p-8 text-white border-4 border-yellow-500 text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent opacity-50 animate-pulse"></div>
                   <Crown className="w-20 h-20 mx-auto text-yellow-400 mb-4 drop-shadow-glow relative z-10" />
                   <h2 className="text-5xl font-black text-yellow-400 uppercase tracking-widest mb-10 relative z-10 drop-shadow-lg">Lip Sync For The Crown</h2>
                   
                   <div className="grid grid-cols-3 gap-4 items-center justify-center relative z-10 max-w-2xl mx-auto">
                     {/* Semi 1 */}
                     <div className="space-y-6">
                        <div className={cn("p-4 rounded-xl border-4 font-black text-lg transition-all shadow-lg", finaleBracket.semi1.winner?.id === finaleBracket.semi1.q1?.id ? "bg-yellow-400 text-indigo-950 border-yellow-200 scale-105" : "bg-indigo-800/50 border-indigo-600")}>{finaleBracket.semi1.q1?.name}</div>
                        <div className="text-indigo-400 font-black italic">VS</div>
                        <div className={cn("p-4 rounded-xl border-4 font-black text-lg transition-all shadow-lg", finaleBracket.semi1.winner?.id === finaleBracket.semi1.q2?.id ? "bg-yellow-400 text-indigo-950 border-yellow-200 scale-105" : "bg-indigo-800/50 border-indigo-600")}>{finaleBracket.semi1.q2?.name}</div>
                     </div>
                     {/* Final Winner Display */}
                     <div className="flex flex-col items-center justify-center">
                        {finaleBracket.final.winner ? (
                            <div className="scale-125 animate-bounce">
                                <div className="p-6 bg-gradient-to-br from-yellow-300 to-yellow-500 text-indigo-950 font-black rounded-2xl shadow-2xl border-4 border-white text-xl">
                                    {finaleBracket.final.winner.name}
                                </div>
                                <p className="text-yellow-300 font-bold mt-4 tracking-widest uppercase text-sm">Winner</p>
                            </div>
                        ) : <Trophy className="w-16 h-16 text-indigo-700 opacity-30" />}
                     </div>
                     {/* Semi 2 */}
                     <div className="space-y-6">
                        <div className={cn("p-4 rounded-xl border-4 font-black text-lg transition-all shadow-lg", finaleBracket.semi2.winner?.id === finaleBracket.semi2.q1?.id ? "bg-yellow-400 text-indigo-950 border-yellow-200 scale-105" : "bg-indigo-800/50 border-indigo-600")}>{finaleBracket.semi2.q1?.name}</div>
                        <div className="text-indigo-400 font-black italic">VS</div>
                        <div className={cn("p-4 rounded-xl border-4 font-black text-lg transition-all shadow-lg", finaleBracket.semi2.winner?.id === finaleBracket.semi2.q2?.id ? "bg-yellow-400 text-indigo-950 border-yellow-200 scale-105" : "bg-indigo-800/50 border-indigo-600")}>{finaleBracket.semi2.q2?.name}</div>
                     </div>
                   </div>
                   {gameState === 'finale' && (
                       <button onClick={runFinalePhase} className="mt-12 w-full max-w-md mx-auto py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-indigo-950 font-black rounded-full text-2xl shadow-lg hover:scale-105 transition-all relative z-10">
                           {finaleBracket.phase === 'final' ? "RUN FINAL LIP SYNC" : `RUN SEMI-FINAL ${finaleBracket.phase === 'semi1' ? '1' : '2'}`}
                       </button>
                   )}
                </div>
              )}
              {renderTrackRecord()}
            </div>

            {/* SIDEBAR */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border-2 border-pink-100 overflow-hidden flex flex-col h-[450px]">
                <div className="bg-pink-50 p-4 font-black text-pink-900 flex items-center gap-2 border-b border-pink-100 tracking-wide"><Drama className="w-5 h-5" /> THE TEA (LOGS)</div>
                <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                  {logs.map((log, i) => (
                    <div key={i} className={cn("text-sm p-3 rounded-lg border-l-[6px] bg-white shadow-sm flex items-start gap-2", 
                        log.type === 'elim' ? "border-red-500 bg-red-50/30" : 
                        log.type === 'win' ? "border-yellow-400 bg-yellow-50/30" : 
                        log.type === 'save' ? "border-amber-500 bg-amber-50/30" : 
                        log.type === 'tea' ? "border-purple-400 bg-purple-50/30 italic text-purple-900" : "border-pink-300"
                    )}>
                       {log.type === 'elim' && <Skull className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                       {log.type === 'win' && <Trophy className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
                       {log.type === 'tea' && <Flame className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />}
                       <div>
                          <span className="font-bold opacity-50 mr-2 text-xs uppercase">{typeof log.week === 'number' ? `WK ${log.week}` : log.week}</span>
                          {log.text}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border-2 border-pink-100 overflow-hidden">
                 <div className="bg-pink-50 p-4 font-black text-pink-900 flex items-center gap-2 border-b border-pink-100 tracking-wide"><Star className="w-5 h-5" /> CAST STATUS</div>
                 <div className="max-h-[450px] overflow-y-auto p-2 space-y-1">
                    {queens.slice().sort((a,b) => b.ppe - a.ppe).map(q => (
                      <div key={q.id} className={cn("flex items-center justify-between p-3 rounded-xl text-sm transition-all border border-transparent", q.active ? "bg-pink-50/50 hover:border-pink-200" : "bg-gray-100 opacity-60 grayscale")}> 
                         <div className="flex items-center gap-3">
                            {q.trackRecord.includes('WINNER') ? <Crown className="w-5 h-5 text-yellow-500" /> :
                             !q.active ? <HeartCrack className="w-4 h-4 text-gray-400" /> :
                             <div className={cn("w-3 h-3 rounded-full", q.narrativeBuff > 2 ? "bg-green-400 animate-pulse" : q.narrativeBuff < 0 ? "bg-red-400" : "bg-pink-300")} />}
                            <div>
                                <p className={cn("font-bold text-base", !q.active && "line-through")}>{q.name}</p>
                                <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">{q.archetype}</p>
                            </div>
                         </div>
                         <div className="text-right">
                             <p className="font-black text-lg leading-none">{q.ppe.toFixed(2)}</p>
                             <p className="text-xs opacity-70 font-medium">{q.wins} W / {q.btm2s} B</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
