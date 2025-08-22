// A semantic color mapping for primary asset types to ensure consistency.
export const ASSET_TYPE_COLORS: { [key: string]: string } = {
  '国内株式': '#3b82f6',
  '米国株式': '#f97316',
  '中国株式': '#ec4899',
  'アセアン株式': '#ef4444',
  '投資信託': '#22c55e',
  '金・プラチナ': '#eab308',
  '国内債券': '#6366f1',
  '外国債券': '#8b5cf6',
  '現金': '#6b7280',
  '仮想通貨': '#14b8a6',
};

// A general palette for non-semantic categories like accounts, or as a fallback.
// Using a separate palette prevents visual confusion with the primary asset type colors.
// Updated to a larger palette for better visual distinction and fewer hash collisions.
export const GENERAL_PALETTE = [
  '#6b21a8', // purple-800
  '#1d4ed8', // blue-700
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#db2777', // pink-600
  '#64748b', // slate-500
  '#4f46e5', // indigo-600
  '#c026d3', // fuchsia-600
];

/**
 * Returns a specific color for a given asset type from the predefined map.
 * @param type The asset type string (e.g., '国内株式').
 * @returns The hex color string if found, otherwise an empty string.
 */
export const getTypeColor = (type: string): string => {
  return ASSET_TYPE_COLORS[type] || '';
};

/**
 * Returns a consistent color for any given string by hashing it.
 * Used for accounts or as a fallback for unknown asset types.
 * @param name The string to hash (e.g., an account name).
 * @returns A hex color string from the general palette.
 */
export const getGeneralColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % GENERAL_PALETTE.length);
  return GENERAL_PALETTE[index];
};
