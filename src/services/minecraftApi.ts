import type { BlockDefinition } from '../engine/types';

// Cache in memoria per evitare fetch ripetuti
const blocksCache = new Map<string, BlockDefinition[]>();

// Genera un colore coerente da una stringa
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '000000'.substring(0, 6 - c.length) + c;
};

// URL texture Minecraft ufficiali via CDN
const getTextureUrl = (blockId: string, version: string): string => {
  // Usa jsDelivr che è più veloce e gestisce meglio i MIME type per le texture
  const baseUrl = `https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@${version}/assets/minecraft/textures/block`;

  // Eccezioni comuni
  if (blockId === 'grass_block') {
    return `${baseUrl}/grass_block_side.png`;
  }

  return `${baseUrl}/${blockId}.png`;
};

export const fetchMinecraftBlocks = async (
  version: string,
  colorMap: Record<string, string>
): Promise<BlockDefinition[]> => {

  // Cache hit
  if (blocksCache.has(version)) {
    return blocksCache.get(version)!;
  }

  try {
    const url = `https://cdn.jsdelivr.net/npm/minecraft-data/data/pc/${version}/blocks.json`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Minecraft version ${version} not found`);
    }

    const rawBlocks = await res.json();

    const mappedBlocks: BlockDefinition[] = rawBlocks
      .filter((b: any) => b?.name && !b.name.includes('air') && !b.name.includes('void'))
      .map((b: any) => ({
        id: b.name,
        name: b.displayName || b.name,
        color: colorMap[b.name] || stringToColor(b.name),
        type: b.name,
        texture: getTextureUrl(b.name, version)
      }))
      // ✨ Specifica il tipo di a e b per TypeScript
      .sort((a: BlockDefinition, b: BlockDefinition) => a.name.localeCompare(b.name));

    // Salva in cache
    blocksCache.set(version, mappedBlocks);

    return mappedBlocks;

  } catch (error) {
    console.error('Error fetching Minecraft blocks:', error);
    return [];
  }
};