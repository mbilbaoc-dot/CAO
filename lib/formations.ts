export interface SlotPosition {
  id: string;
  label: string; // "POR", "DFC", "LI", "LD", "MC", "MCD", etc.
  top: number;   // % from top of pitch
  left: number;  // % from left of pitch
}

export interface Formation {
  name: string;
  slots: SlotPosition[];
}

export const FORMATIONS: Formation[] = [
  {
    name: '4-3-3',
    slots: [
      { id: 'por', label: 'POR', top: 90, left: 50 },
      { id: 'li', label: 'LI', top: 72, left: 10 },
      { id: 'dfc1', label: 'DFC', top: 75, left: 35 },
      { id: 'dfc2', label: 'DFC', top: 75, left: 65 },
      { id: 'ld', label: 'LD', top: 72, left: 90 },
      { id: 'mc1', label: 'MC', top: 52, left: 25 },
      { id: 'mc2', label: 'MC', top: 48, left: 50 },
      { id: 'mc3', label: 'MC', top: 52, left: 75 },
      { id: 'ei', label: 'EI', top: 22, left: 15 },
      { id: 'dc', label: 'DC', top: 15, left: 50 },
      { id: 'ed', label: 'ED', top: 22, left: 85 },
    ],
  },
  {
    name: '4-4-2',
    slots: [
      { id: 'por', label: 'POR', top: 90, left: 50 },
      { id: 'li', label: 'LI', top: 72, left: 10 },
      { id: 'dfc1', label: 'DFC', top: 75, left: 35 },
      { id: 'dfc2', label: 'DFC', top: 75, left: 65 },
      { id: 'ld', label: 'LD', top: 72, left: 90 },
      { id: 'mi', label: 'MI', top: 50, left: 12 },
      { id: 'mci', label: 'MC', top: 52, left: 38 },
      { id: 'mcd', label: 'MC', top: 52, left: 62 },
      { id: 'md', label: 'MD', top: 50, left: 88 },
      { id: 'dc1', label: 'DC', top: 18, left: 35 },
      { id: 'dc2', label: 'DC', top: 18, left: 65 },
    ],
  },
  {
    name: '4-2-3-1',
    slots: [
      { id: 'por', label: 'POR', top: 90, left: 50 },
      { id: 'li', label: 'LI', top: 72, left: 10 },
      { id: 'dfc1', label: 'DFC', top: 75, left: 35 },
      { id: 'dfc2', label: 'DFC', top: 75, left: 65 },
      { id: 'ld', label: 'LD', top: 72, left: 90 },
      { id: 'mcd1', label: 'MCD', top: 58, left: 35 },
      { id: 'mcd2', label: 'MCD', top: 58, left: 65 },
      { id: 'mi', label: 'MI', top: 36, left: 15 },
      { id: 'mco', label: 'MCO', top: 34, left: 50 },
      { id: 'md', label: 'MD', top: 36, left: 85 },
      { id: 'dc', label: 'DC', top: 14, left: 50 },
    ],
  },
  {
    name: '3-5-2',
    slots: [
      { id: 'por', label: 'POR', top: 90, left: 50 },
      { id: 'dfc1', label: 'DFC', top: 75, left: 22 },
      { id: 'dfc2', label: 'DFC', top: 75, left: 50 },
      { id: 'dfc3', label: 'DFC', top: 75, left: 78 },
      { id: 'cri', label: 'CRI', top: 52, left: 8 },
      { id: 'mc1', label: 'MC', top: 52, left: 30 },
      { id: 'mc2', label: 'MC', top: 48, left: 50 },
      { id: 'mc3', label: 'MC', top: 52, left: 70 },
      { id: 'crd', label: 'CRD', top: 52, left: 92 },
      { id: 'dc1', label: 'DC', top: 18, left: 35 },
      { id: 'dc2', label: 'DC', top: 18, left: 65 },
    ],
  },
  {
    name: '3-4-3',
    slots: [
      { id: 'por', label: 'POR', top: 90, left: 50 },
      { id: 'dfc1', label: 'DFC', top: 75, left: 22 },
      { id: 'dfc2', label: 'DFC', top: 75, left: 50 },
      { id: 'dfc3', label: 'DFC', top: 75, left: 78 },
      { id: 'mi', label: 'MI', top: 50, left: 12 },
      { id: 'mci', label: 'MC', top: 52, left: 38 },
      { id: 'mcd', label: 'MC', top: 52, left: 62 },
      { id: 'md', label: 'MD', top: 50, left: 88 },
      { id: 'ei', label: 'EI', top: 22, left: 15 },
      { id: 'dc', label: 'DC', top: 15, left: 50 },
      { id: 'ed', label: 'ED', top: 22, left: 85 },
    ],
  },
  {
    name: '5-3-2',
    slots: [
      { id: 'por', label: 'POR', top: 90, left: 50 },
      { id: 'cri', label: 'CRI', top: 70, left: 8 },
      { id: 'dfc1', label: 'DFC', top: 76, left: 28 },
      { id: 'dfc2', label: 'DFC', top: 78, left: 50 },
      { id: 'dfc3', label: 'DFC', top: 76, left: 72 },
      { id: 'crd', label: 'CRD', top: 70, left: 92 },
      { id: 'mc1', label: 'MC', top: 50, left: 25 },
      { id: 'mc2', label: 'MC', top: 46, left: 50 },
      { id: 'mc3', label: 'MC', top: 50, left: 75 },
      { id: 'dc1', label: 'DC', top: 18, left: 35 },
      { id: 'dc2', label: 'DC', top: 18, left: 65 },
    ],
  },
  {
    name: '4-1-4-1',
    slots: [
      { id: 'por', label: 'POR', top: 90, left: 50 },
      { id: 'li', label: 'LI', top: 72, left: 10 },
      { id: 'dfc1', label: 'DFC', top: 75, left: 35 },
      { id: 'dfc2', label: 'DFC', top: 75, left: 65 },
      { id: 'ld', label: 'LD', top: 72, left: 90 },
      { id: 'mcd', label: 'MCD', top: 60, left: 50 },
      { id: 'mi', label: 'MI', top: 40, left: 12 },
      { id: 'mci', label: 'MC', top: 42, left: 38 },
      { id: 'mcd2', label: 'MC', top: 42, left: 62 },
      { id: 'md', label: 'MD', top: 40, left: 88 },
      { id: 'dc', label: 'DC', top: 14, left: 50 },
    ],
  },
];
