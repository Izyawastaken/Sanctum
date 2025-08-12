export function toShowdownId(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}
export function toSpriteId(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]/g, '');
}
const validTypes = [
  'normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
];
export function sanitizeType(type: string): string | null {
  const clean = toShowdownId(type.trim());
  return validTypes.includes(clean) ? clean : null;
} 