import React, { useCallback, useEffect, useMemo, useState, useRef, useTransition } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams, Link } from 'react-router-dom';
import AccentPicker from '../shared/AccentPicker';
import { parsePaste } from '../utils/parser';
import { toSpriteId, sanitizeType } from '../utils/text';
import { performanceMonitor, imagePreloader, memoryManager, debounce, throttle, LRUCache } from '../utils/performance';
import '../styles/view.css';

const SUPABASE_URL = 'https://pywievpwcedaareqkuxm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5d2lldnB3Y2VkYWFyZXFrdXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTA5MjMsImV4cCI6MjA2Nzg4NjkyM30.wHvcWCjkejn811z_ELF-9zvoR8_UjIYJd2e57A8QBIs';
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const natureMods: Record<string, { up?: string; down?: string }> = {
  adamant: { up: 'atk', down: 'spa' },
  modest: { up: 'spa', down: 'atk' },
  timid: { up: 'spe', down: 'atk' },
  jolly: { up: 'spe', down: 'spa' },
  bold: { up: 'def', down: 'atk' },
  calm: { up: 'spd', down: 'atk' },
  careful: { up: 'spd', down: 'spa' },
  impish: { up: 'def', down: 'spa' },
  relaxed: { up: 'def', down: 'spe' },
  quiet: { up: 'spa', down: 'spe' },
  brave: { up: 'atk', down: 'spe' },
  lonely: { up: 'atk', down: 'def' },
};

// Map problematic species names to PokeAPI slugs
const pokeapiNameMap: Record<string, string> = {
  'indeedee-f': 'indeedee-female', 'indeedee-m': 'indeedee-male',
  'meowstic-f': 'meowstic-female', 'meowstic-m': 'meowstic-male',
  'basculegion-f': 'basculegion-female', 'basculegion-m': 'basculegion-male',
  'oinkologne-f': 'oinkologne-female', 'oinkologne-m': 'oinkologne-male',
  'frillish-f': 'frillish-female', 'frillish-m': 'frillish-male',
  'jellicent-f': 'jellicent-female', 'jellicent-m': 'jellicent-male',
  'pyroar-f': 'pyroar-female', 'pyroar-m': 'pyroar-male',
  'unfezant-f': 'unfezant-female', 'unfezant-m': 'unfezant-male',
  'indeedee': 'indeedee-male', 'meowstic': 'meowstic-male', 'basculegion': 'basculegion-male', 'oinkologne': 'oinkologne-male',
  'frillish': 'frillish-male', 'jellicent': 'jellicent-male', 'pyroar': 'pyroar-male', 'unfezant': 'unfezant-male',
  'rotom-wash': 'rotom-wash', 'rotom-heat': 'rotom-heat', 'rotom-frost': 'rotom-frost', 'rotom-fan': 'rotom-fan', 'rotom-mow': 'rotom-mow', 'rotom': 'rotom',
  'urshifu-rapid-strike': 'urshifu-rapid-strike', 'urshifu-single-strike': 'urshifu-single-strike', 'urshifu': 'urshifu-single-strike',
  'zacian-crowned': 'zacian-crowned', 'zamazenta-crowned': 'zamazenta-crowned',
  'calyrex-ice': 'calyrex-ice', 'calyrex-shadow': 'calyrex-shadow',
  'toxtricity-low-key': 'toxtricity-low-key', 'toxtricity-amped': 'toxtricity-amped', 'toxtricity': 'toxtricity-amped',
  'basculin-blue-striped': 'basculin-blue-striped', 'basculin-white-striped': 'basculin-white-striped', 'basculin-red-striped': 'basculin-red-striped', 'basculin': 'basculin-red-striped',
  'lycanroc-midnight': 'lycanroc-midnight', 'lycanroc-dusk': 'lycanroc-dusk', 'lycanroc': 'lycanroc',
  'darmanitan-galar': 'darmanitan-galar', 'darmanitan-galar-zen': 'darmanitan-galar-zen', 'darmanitan': 'darmanitan',
  'giratina-origin': 'giratina-origin', 'giratina': 'giratina-altered',
  'shaymin-sky': 'shaymin-sky', 'shaymin': 'shaymin-land',
  'tornadus-therian': 'tornadus-therian', 'thundurus-therian': 'thundurus-therian', 'landorus-therian': 'landorus-therian', 'tornadus': 'tornadus-incarnate', 'thundurus': 'thundurus-incarnate', 'landorus': 'landorus-incarnate',
  'enamorus-therian': 'enamorus-therian', 'enamorus': 'enamorus-incarnate',
  'zygarde-10': 'zygarde-10', 'zygarde-complete': 'zygarde-complete', 'zygarde': 'zygarde',
  'polteageist-antique': 'polteageist', 'polteageist': 'polteageist',
  'sinistea-antique': 'sinistea', 'sinistea': 'sinistea',
  'minior-red': 'minior-red-meteor', 'minior': 'minior-red-meteor',
  'mimikyu-busted': 'mimikyu-busted', 'mimikyu': 'mimikyu-disguised',
  'greattusk': 'great-tusk','screamtail': 'scream-tail','brutebonnet': 'brute-bonnet','fluttermane': 'flutter-mane','slitherwing': 'slither-wing','sandyshocks': 'sandy-shocks','irontreads': 'iron-treads','ironbundle': 'iron-bundle','ironhands': 'iron-hands','ironjugulis': 'iron-jugulis','ironmoth': 'iron-moth','ironthorns': 'iron-thorns','roaringmoon': 'roaring-moon','ironvaliant': 'iron-valiant'
};

export default function Viewer() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('Loading…');
  const [author, setAuthor] = useState<string>('');
  const [raw, setRaw] = useState<string>('');
  const [team, setTeam] = useState<any[]>([]);
  const [aniSprites, setAniSprites] = useState<boolean>(() => {
    const val = localStorage.getItem('sanctum-ani-sprites');
    return val === null ? true : val === 'true';
  });
  const [expertMode, setExpertMode] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const cache = useRef(new LRUCache<string, any>(100));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect external calculator extension presence
    const present = !!document.querySelector('meta[name="neoShowdownExtPresent"]');
    setShowCalc(present);
    if (!present) {
      const observer = new MutationObserver(() => {
        const now = !!document.querySelector('meta[name="neoShowdownExtPresent"]');
        if (now) {
          setShowCalc(true);
          observer.disconnect();
        }
      });
      observer.observe(document.head, { childList: true });
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setTitle('Invalid Paste Link');
      return;
    }
    (async () => {
      const { data } = await client.from('pastes').select().eq('id', id).single();
      if (!data) {
        setTitle('Paste Not Found');
        return;
      }
      setTitle(data.title || 'Untitled Paste');
      setAuthor(data.author || '');
      setRaw(data.content || '');
      const parsed = parsePaste(data.content || '');
      setTeam(parsed);

      // Preload sprites for this team for smoother display
      const head = document.head;
      [...head.querySelectorAll('link[data-preload-sprite]')].forEach(l => l.remove());
      parsed.forEach(mon => {
        const showdownName = toSpriteId(mon.name);
        const original = `https://play.pokemonshowdown.com/sprites/gen5${mon.shiny ? '-shiny' : ''}/${showdownName}.png`;
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = original;
        link.setAttribute('data-preload-sprite', '');
        head.appendChild(link);
      });
    })();
  }, [id]);

  useEffect(() => {
    localStorage.setItem('sanctum-ani-sprites', aniSprites ? 'true' : 'false');
  }, [aniSprites]);

  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText((raw || '').trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [raw]);



  // Calculator mode
  const [calculatorMode, setCalculatorMode] = useState(false);
  const onOpenCalc = useCallback(() => {
    setCalculatorMode(true);
    document.body.style.cursor = 'crosshair';
    const cards = document.querySelectorAll('.pokemon-card');
    cards.forEach(card => {
      card.classList.add('calculator-selectable');
      (card as HTMLElement).title = 'Click to open this set in the Showdown Calculator';
    });
    function handler(e: MouseEvent) {
      const card = (e.target as HTMLElement).closest('.pokemon-card.calculator-selectable') as HTMLElement | null;
      if (card) {
        e.stopPropagation();
        exportToCalculator(card, raw);
        cleanup();
      } else cleanup();
    }
    function cleanup() {
      setCalculatorMode(false);
      document.body.style.cursor = '';
      const cs = document.querySelectorAll('.pokemon-card');
      cs.forEach(c => { c.classList.remove('calculator-selectable'); (c as HTMLElement).title = ''; });
      document.removeEventListener('click', handler, { capture: true } as any);
    }
    document.addEventListener('click', handler, { capture: true });
  }, [raw]);

  return (
    <div className="container">
      <header>
        <h1 id="paste-title">{title}</h1>
        <p className="subtitle" id="paste-author">{author ? `By ${author}` : ''}</p>
      </header>

      <div id="team-container" className="grid-layout">
        {team.map((mon, i) => (
          <PokemonCard key={i} mon={mon} aniSprites={aniSprites} expertMode={expertMode} />
        ))}
      </div>

      <footer>
        <pre id="pasteDisplay" style={{ display: 'none' }}>{raw}</pre>
        <div className="footer-buttons">
                     <button id="copyBtn" className={`fancy-btn ${copied ? 'copied' : ''}`} onClick={onCopy}>{copied ? '📋 Copied!' : '📋 Copy to Clipboard'}</button>
           <LayoutToggle />
           <button className="fancy-btn" onClick={() => setAniSprites(v => !v)}>{aniSprites ? 'Static Sprites' : 'Animated Sprites'}</button>
          <button id="toggleExpertMode" className="fancy-btn" onClick={() => setExpertMode(v => !v)}>{expertMode ? 'Hide Raw Damage Modifiers' : 'Show Raw Damage Modifiers'}</button>
          {showCalc && (
            <button id="openCalcBtn" className="fancy-btn" onClick={onOpenCalc}>Open in Calculator</button>
          )}
        </div>
        <div id="secret-btns">
          {renderSecretButtons(author)}
        </div>
      </footer>

      <div id="report-issue-container" style={{ textAlign: 'center', margin: '2rem 0' }}>
        <a href="https://github.com/Izyawastaken/NeoPaste/issues" target="_blank" rel="noreferrer" className="report-btn">🐛 Report Issues Here</a>
      </div>
      <Link to="/" className="back-link">Back to Paste Builder</Link>

      <AccentPicker />
    </div>
  );
}

function LayoutToggle() {
  const [mode, setMode] = useState<'grid' | 'horizontal'>('grid');
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  useEffect(() => {
    const container = document.getElementById('team-container');
    if (!container) return;
    if (isMobile) {
      container.classList.remove('horizontal-layout');
      container.classList.add('mobile-layout');
    } else {
      container.classList.remove('mobile-layout');
      container.classList.toggle('horizontal-layout', mode === 'horizontal');
      container.classList.toggle('grid-layout', mode === 'grid');
    }
  }, [mode, isMobile]);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  if (isMobile) return null;
  return (
    <button id="layoutToggle" className="fancy-btn" onClick={() => setMode(m => m === 'grid' ? 'horizontal' : 'grid')}>
      {mode === 'grid' ? 'Switch to Horizontal Layout' : 'Switch to Grid Layout'}
    </button>
  );
}

function PokemonCard({ mon, aniSprites, expertMode }: { mon: any; aniSprites: boolean; expertMode: boolean }) {
  const showdownName = toSpriteId(mon.name);
  const staticSprite = mon.shiny
    ? `https://play.pokemonshowdown.com/sprites/gen5-shiny/${showdownName}.png`
    : `https://play.pokemonshowdown.com/sprites/gen5/${showdownName}.png`;
  const aniSpritePrim = mon.shiny
    ? `https://play.pokemonshowdown.com/sprites/gen5ani-shiny/${showdownName}.gif`
    : `https://play.pokemonshowdown.com/sprites/gen5ani/${showdownName}.gif`;
  const aniSpriteFallback = mon.shiny
    ? `https://play.pokemonshowdown.com/sprites/ani-shiny/${showdownName}.gif`
    : `https://play.pokemonshowdown.com/sprites/ani/${showdownName}.gif`;

  const [spriteSrc, setSpriteSrc] = useState<string>(aniSprites ? aniSpritePrim : staticSprite);
  useEffect(() => {
    if (aniSprites) {
      setSpriteSrc(aniSpritePrim);
    } else {
      setSpriteSrc(staticSprite);
    }
  }, [aniSprites, aniSpritePrim, staticSprite]);

  const teraType = sanitizeType(mon.teraType || '');
  const teraTypeClass = teraType ? `type-${teraType}` : '';

  const itemIcon = useMemo(() => {
    if (!mon.item) return null;
    const itemId = mon.item.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    const base = (import.meta as any).env?.BASE_URL.replace(/\/$/, '') || '';
    const itemUrl = `${base}/Items/${itemId}.png`;
    return <img className="item-icon" src={itemUrl} alt={mon.item} title={mon.item} loading="lazy" onError={(e) => {
      const target = e.target as HTMLImageElement;
      target.style.display = 'none';
    }} />;
  }, [mon.item]);

  return (
    <div className="pokemon-card">
      <div className="card-header">
        <h2>{mon.nickname ? `${mon.nickname} (${mon.name})` : mon.name}</h2>
        <p className="item-line">@ <span>{mon.item || 'None'}{itemIcon}</span></p>
      </div>
      <img src={spriteSrc} alt={mon.name} data-pokemon-name={mon.name} data-shiny={mon.shiny ? '1' : '0'}
        onError={() => setSpriteSrc(s => s === aniSpritePrim ? aniSpriteFallback : staticSprite)} />
      <p><strong>Ability:</strong> <span className="info-pill ability-pill">{mon.ability || '—'}</span></p>
      <p><strong>Tera Type:</strong> <span className={`info-pill ${teraTypeClass}`}>{mon.teraType || '—'}</span></p>
      <Nature mon={mon} />
      <p><strong>EVs:</strong> {formatEVs(mon.evs)}</p>
      <p><strong>IVs:</strong> {formatIVs(mon.ivs)}</p>
      <StatBlock mon={mon} expertMode={expertMode} />
      <div className="moves">
        <strong>Moves:</strong>
        <div className="move-pill-container"><MovePills moves={mon.moves} /></div>
      </div>
    </div>
  );
}

function Nature({ mon }: { mon: any }) {
  const nature = (mon.nature || '').toLowerCase();
  const upStat = natureMods[nature]?.up;
  const statAbbrMap: Record<string, string> = { hp: 'HP', atk: 'ATK', def: 'DEF', spa: 'SPA', spd: 'SPD', spe: 'SPE' };
  const colorClass = upStat ? `stat-${upStat}` : '';
  const boostAbbr = upStat ? statAbbrMap[upStat] : '';
  return (
    <p><strong>Nature:</strong> <span className={`info-pill nature-pill ${colorClass}`} data-boost={boostAbbr || undefined}>{mon.nature || '—'}</span></p>
  );
}

function StatBlock({ mon, expertMode }: { mon: any; expertMode: boolean }) {
  const [stats, setStats] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mappedKey = toSpriteId(mon.name);
        const mappedName = pokeapiNameMap[mappedKey] || mappedKey;
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${mappedName}`);
        const data = await res.json();
        if (!cancelled) setStats(data.stats || []);
      } catch {
        if (!cancelled) setStats([]);
      }
    })();
    return () => { cancelled = true; };
  }, [mon.name]);

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.stat-bar-fill').forEach(bar => {
        const base = +(bar as HTMLElement).dataset.base!;
        (bar as HTMLElement).style.width = `${Math.min(100, (base / 255) * 100)}%`;
        (bar as HTMLElement).style.backgroundColor = base >= 130 ? '#00e676' : base >= 100 ? '#ffee58' : base >= 70 ? '#ffa726' : '#ef5350';
      });
    });
  }, [stats]);

  const mods = natureMods[(mon.nature || '').toLowerCase()] || {};

  return (
    <div className="stat-block">
      {stats.map((s: any, idx: number) => {
        const raw = s.stat.name as string;
        const short = STAT_NAME_MAP[raw] || raw.toUpperCase();
        const base = s.base_stat as number;
        const k = short.toLowerCase();
        const mod = k === mods.up ? '+' : k === mods.down ? '−' : '';

        const ev = mon.evs?.[k] ?? 0;
        const iv = mon.ivs?.[k] ?? (k === 'atk' ? 0 : 31);
        let display = base;
        if (expertMode) {
          const level = 100;
          if (k === 'hp') {
            display = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
          } else {
            const baseStat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
            const natureMult = k === mods.up ? 1.1 : k === mods.down ? 0.9 : 1;
            display = Math.floor(baseStat * natureMult);
          }
        }

        return (
          <div className="stat-line" key={idx}>
            <span className={`stat-label ${k}`}>{short}</span>
            <div className="stat-bar"><div className="stat-bar-fill" data-base={base}></div></div>
            {mod ? <span className={`stat-modifier ${mod === '+' ? 'plus' : 'minus'}`}>{mod}</span> : null}
            <span className="stat-value" data-base={base} data-stat={k} data-ev={ev} data-iv={iv}>{display}</span>
          </div>
        );
      })}
    </div>
  );
}

const STAT_NAME_MAP: Record<string, string> = { hp: 'HP', attack: 'Atk', defense: 'Def', 'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'Spe' };

function formatEVs(evs: Record<string, number> = {}) {
  return Object.entries(evs).filter(([, v]) => v > 0).map(([k, v]) => {
    const short = (STAT_NAME_MAP[k] || k).toLowerCase();
    return <span key={k} className={`info-pill stat-${short}`}>{v} {(STAT_NAME_MAP[k] || k).toUpperCase()}</span>;
  });
}

function getIVColor(percent: number) {
  const r = percent < 0.5 ? 255 : Math.round(510 * (1 - percent));
  const g = percent < 0.5 ? Math.round(510 * percent) : 255;
  return `rgb(${r}, ${g}, 100)`;
}

function formatIVs(ivs: Record<string, number> = {}) {
  const output = Object.entries(ivs).filter(([, v]) => v < 31).map(([k, v]) => (
    <span key={k} className="info-pill" style={{ backgroundColor: getIVColor(v / 31) }}>{v} {k.toUpperCase()}</span>
  ));
  return output.length ? output : <span className="info-pill" style={{ backgroundColor: getIVColor(1) }}>Default (31)</span>;
}

function MovePills({ moves }: { moves: string[] }) {
  const [types, setTypes] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(moves.map(async (move) => {
        const id = move.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/move/${id}`);
          const { type } = await res.json();
          return [move, type?.name?.toLowerCase() || 'normal'] as const;
        } catch {
          return [move, 'normal'] as const;
        }
      }));
      if (!cancelled) setTypes(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [moves]);

  return (
    <>
      {moves.map(move => (
        <span key={move} className={`move-pill type-${types[move] || 'normal'}`}>{move.replace(/-/g, ' ')}</span>
      ))}
    </>
  );
}



function renderSecretButtons(author: string) {
  const secretLinks: Record<string, { label: string; url: string }[]> = {
    'whimsy': [{ label: 'Visit the creator!', url: 'https://www.twitch.tv/whimsygaming1314' }],
    'izya': [{ label: 'Visit the creator!', url: 'https://www.twitch.tv/izyalovesgothmommies' }],
    'katakuna_64': [{ label: 'Visit the creator!', url: 'https://www.twitch.tv/katakuna_64' }]
  };
  const key = (author || '').toLowerCase();
  if (!secretLinks[key]) return null;
  return secretLinks[key].map((link, i) => (
    <button key={i} className="secret-btn" onClick={() => window.open(link.url, '_blank')}>{link.label}</button>
  ));
}

function exportToCalculator(card: HTMLElement, rawText: string) {
  const cards = Array.from(document.querySelectorAll('.pokemon-card'));
  const idx = cards.indexOf(card);
  if (idx === -1) return;
  const blocks = (rawText || '').trim().split(/\n\s*\n/);
  const setText = blocks[idx] || '';
  if (!setText) return;
  fetch('https://neocalc.agastyawastaken.workers.dev/upload', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: setText })
    .then(res => res.text())
    .then(token => {
      if (token && token.length < 32) {
        window.open(`https://calc.pokemonshowdown.com/?neopaste=${encodeURIComponent(token)}`, '_blank');
      } else {
        alert('Failed to get token from worker.');
      }
    })
    .catch(() => alert('Failed to contact worker.'));
} 