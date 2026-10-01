export const SECTOR_COLORS = [
  "#387ed1",
  "#7c6fd0",
  "#2ca66f",
  "#e8a13c",
  "#df514c",
  "#38b6d3",
  "#c86dd7",
  "#8ab661",
];

const SECTOR_ORDER = [
  "Financial Sector",
  "Tech Sector",
  "Consumer",
  "Power",
  "Pipe Sector",
  "Others",
];

export function sectorColor(sector: string): string {
  let i = SECTOR_ORDER.indexOf(sector);
  if (i < 0) {
    let h = 0;
    for (const c of sector) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    i = h % SECTOR_COLORS.length;
  }
  return SECTOR_COLORS[i % SECTOR_COLORS.length];
}
