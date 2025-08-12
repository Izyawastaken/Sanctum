export type ParsedMon = {
  name: string;
  nickname?: string;
  gender: 'M' | 'F' | null;
  item: string;
  ability: string;
  shiny: boolean;
  teraType: string;
  evs: Record<string, number>;
  ivs: Record<string, number>;
  nature: string;
  moves: string[];
};

export function parsePaste(text: string): ParsedMon[] {
  const blocks = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split(/\n{2,}(?=\S)/g);
  const team: ParsedMon[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const mon: ParsedMon = { name: '', nickname: '', gender: null, item: '', ability: '', shiny: false, teraType: '', evs: {}, ivs: {}, nature: '', moves: [] };

    const first = lines[0];
    const nameMatch = first.match(/^(.+?)(?: \((M|F)\))? @ (.+)$/);
    const fallbackMatch = first.match(/^(.+?)(?: \((M|F)\))?$/);
    if (nameMatch) {
      mon.name = nameMatch[1].trim();
      mon.gender = (nameMatch[2] as 'M' | 'F' | undefined) || null;
      mon.item = nameMatch[3].trim();
    } else if (fallbackMatch) {
      mon.name = fallbackMatch[1].trim();
      mon.gender = (fallbackMatch[2] as 'M' | 'F' | undefined) || null;
      mon.item = '';
    } else {
      continue;
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('Ability:')) mon.ability = line.split(':')[1].trim();
      else if (line.startsWith('Shiny:')) mon.shiny = line.split(':')[1].trim().toLowerCase() === 'yes';
      else if (line.startsWith('Tera Type:')) mon.teraType = line.split(':')[1].trim();
      else if (line.startsWith('EVs:')) line.slice(4).split('/').forEach(part => { const [val, stat] = part.trim().split(' '); if (val && stat) mon.evs[stat.toLowerCase()] = parseInt(val); });
      else if (line.startsWith('IVs:')) line.slice(4).split('/').forEach(part => { const [val, stat] = part.trim().split(' '); if (val && stat) mon.ivs[stat.toLowerCase()] = parseInt(val); });
      else if (line.endsWith('Nature')) mon.nature = line.replace('Nature', '').trim();
      else if (line.startsWith('- ')) mon.moves.push(line.slice(2).trim());
    }
    team.push(mon);
  }

  return team;
} 