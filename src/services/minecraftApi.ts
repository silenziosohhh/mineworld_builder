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
  // Fix per versioni vecchie (1.12.2 e precedenti usano 'blocks' invece di 'block')
  const isLegacy = ['1.12.2', '1.11.2', '1.10.2', '1.9.4', '1.8.9'].includes(version) || version.startsWith('1.7');
  const folder = isLegacy ? 'blocks' : 'block';
  
  const baseUrl = `https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@${version}/assets/minecraft/textures/${folder}`;

  // Eccezioni comuni
  if (blockId === 'grass_block') {
    return `${baseUrl}/grass_block_side.png`;
  }
  if (blockId === 'water' || blockId === 'stationary_water') {
    return `${baseUrl}/water_still.png`;
  }
  if (blockId === 'lava' || blockId === 'stationary_lava') {
    return `${baseUrl}/lava_still.png`;
  }
  if (blockId === 'fire') {
    return `${baseUrl}/fire_0.png`;
  }

  return `${baseUrl}/${blockId}.png`;
};

export const fetchMinecraftVersions = async (): Promise<string[]> => {
  const defaults = ['1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.8.9'];
  try {
    // Recupera la lista delle versioni disponibili da minecraft-data
    const res = await fetch('https://cdn.jsdelivr.net/npm/minecraft-data/data/dataPaths.json');
    if (!res.ok) throw new Error('Failed to fetch versions');
    const data = await res.json();
    
    if (!data.pc) throw new Error('No PC versions found');
    
    // Estrae e ordina le versioni (dalla più recente)
    return Object.keys(data.pc).sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if ((pa[i] || 0) > (pb[i] || 0)) return -1;
        if ((pa[i] || 0) < (pb[i] || 0)) return 1;
      }
      return 0;
    });
  } catch (e) {
    console.warn('Failed to fetch dynamic versions', e);
    return defaults;
  }
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
      .filter((b: any) => 
        b?.name && 
        !b.name.includes('air') && 
        !b.name.includes('void') &&
        !b.name.includes('spawner') &&     // No Spawners
        !b.name.includes('spawn_egg') &&   // No Uova
        !b.name.includes('infested') &&    // No Silverfish blocks
        !b.name.includes('piston_head') && // No parti tecniche
        !b.name.includes('moving_piston') &&
        !b.name.endsWith('_wall_head') &&
        !b.name.endsWith('_wall_sign')
      )
      .map((b: any) => {
        // Normalizza nomi per versioni vecchie
        let displayName = b.displayName || b.name;
        if (b.name === 'stationary_water') displayName = 'Water';
        if (b.name === 'stationary_lava') displayName = 'Lava';

        return {
          id: b.name,
          name: displayName,
          color: colorMap[b.name] || stringToColor(b.name),
          texture: getTextureUrl(b.name, version)
        };
      })
      // ✨ Specifica il tipo di a e b per TypeScript
      .sort((a: BlockDefinition, b: BlockDefinition) => a.name.localeCompare(b.name));

    // Forza l'inserimento di elementi essenziali se mancano
    ['water', 'lava', 'fire'].forEach(id => {
      if (!mappedBlocks.find(b => b.id === id || b.id === `stationary_${id}`)) {
        mappedBlocks.unshift({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          color: colorMap[id] || stringToColor(id),
          texture: getTextureUrl(id, version)
        });
      }
    });

    // Salva in cache
    blocksCache.set(version, mappedBlocks);

    return mappedBlocks;

  } catch (error) {
    console.error('Error fetching Minecraft blocks:', error);
    return [];
  }
};