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

  // 1. Mappatura diretta per blocchi specifici (priorità alta)
  const directMap: Record<string, string> = {
    'grass_block': 'grass_block_side',
    'dirt_path': 'dirt_path_side',
    'podzol': 'podzol_side',
    'mycelium': 'mycelium_side',
    // Liquids & Fire
    'water': 'water_still',
    'stationary_water': 'water_still',
    'lava': 'lava_still',
    'stationary_lava': 'lava_still',
    'fire': 'fire_0',
    'soul_fire': 'soul_fire_0',
    'magma_block': 'magma',
    // Lights
    'torch': 'torch',
    'soul_torch': 'soul_torch',
    'redstone_torch': 'redstone_torch',
    'glowstone': 'glowstone',
    'sea_lantern': 'sea_lantern',
    'shroomlight': 'shroomlight',
    'ochre_froglight': 'ochre_froglight_side',
    'verdant_froglight': 'verdant_froglight_side',
    'pearlescent_froglight': 'pearlescent_froglight_side',
    'lantern': 'lantern',
    'soul_lantern': 'soul_lantern',
    'campfire': 'campfire_log',
    'soul_campfire': 'soul_campfire_log',
    'redstone_lamp': 'redstone_lamp_off',
    // Functional
    'snow_block': 'snow',
    'snow': 'snow',
    'crafting_table': 'crafting_table_front',
    'furnace': 'furnace_front',
    'dispenser': 'dispenser_front',
    'dropper': 'dropper_front',
    'observer': 'observer_front',
    'piston': 'piston_side',
    'sticky_piston': 'piston_side',
    'tnt': 'tnt_side',
    'bookshelf': 'bookshelf',
    'jukebox': 'jukebox_side',
    'note_block': 'note_block',
    'lectern': 'lectern_top',
    'composter': 'composter_side',
    'barrel': 'barrel_side',
    'smoker': 'smoker_front',
    'blast_furnace': 'blast_furnace_front',
    'cartography_table': 'cartography_table_side3',
    'fletching_table': 'fletching_table_top',
    'grindstone': 'grindstone_side',
    'smithing_table': 'smithing_table_front',
    'stonecutter': 'stonecutter_side',
    'loom': 'loom_side',
    'enchanting_table': 'enchanting_table_side',
    'end_portal_frame': 'end_portal_frame_side',
    'respawn_anchor': 'respawn_anchor_side0',
    'lodestone': 'lodestone_side',
    'target': 'target_side',
    'scaffolding': 'scaffolding_side',
    // Nature & Crops
    'pumpkin': 'pumpkin_side',
    'carved_pumpkin': 'carved_pumpkin',
    'jack_o_lantern': 'jack_o_lantern',
    'melon': 'melon_side',
    'hay_block': 'hay_block_side',
    'cactus': 'cactus_side',
    'cake': 'cake_top',
    'nether_wart_block': 'nether_wart_block',
    'warped_wart_block': 'warped_wart_block',
    'mushroom_stem': 'mushroom_stem',
    'red_mushroom_block': 'red_mushroom_block',
    'brown_mushroom_block': 'brown_mushroom_block',
    'bamboo': 'bamboo_stalk',
    'dried_kelp_block': 'dried_kelp_side',
    'honey_block': 'honey_block_side',
    'slime_block': 'slime',
    'sponge': 'sponge',
    'wet_sponge': 'wet_sponge',
    // Ores & Minerals
    'quartz_block': 'quartz_block_side',
    'chiseled_quartz_block': 'chiseled_quartz_block_side',
    'quartz_pillar': 'quartz_pillar_side',
    'sandstone': 'sandstone_side',
    'chiseled_sandstone': 'chiseled_sandstone',
    'cut_sandstone': 'cut_sandstone',
    'red_sandstone': 'red_sandstone_side',
    'chiseled_red_sandstone': 'chiseled_red_sandstone',
    'cut_red_sandstone': 'cut_red_sandstone',
    'basalt': 'basalt_side',
    'polished_basalt': 'polished_basalt_side',
    'ancient_debris': 'ancient_debris_side',
    'amethyst_block': 'amethyst_block',
    'budding_amethyst': 'budding_amethyst',
    'amethyst_cluster': 'amethyst_cluster',
    'deepslate': 'deepslate',
    'reinforced_deepslate': 'reinforced_deepslate_side',
    'calcite': 'calcite',
    'tuff': 'tuff',
    'dripstone_block': 'dripstone_block',
    'pointed_dripstone': 'pointed_dripstone_up_tip',
    // Copper
    'copper_block': 'copper_block',
    'cut_copper': 'cut_copper',
    'exposed_copper': 'exposed_copper',
    'weathered_copper': 'weathered_copper',
    'oxidized_copper': 'oxidized_copper',
    // Misc
    'bone_block': 'bone_block_side',
    'purpur_pillar': 'purpur_pillar',
    'glass_pane': 'glass',
    'iron_bars': 'iron_bars',
    'chain': 'chain',
    'ladder': 'ladder',
    'rail': 'rail_normal',
    'powered_rail': 'powered_rail_on',
    'detector_rail': 'detector_rail_on',
    'activator_rail': 'activator_rail_on',
    'lever': 'lever',
    'tripwire_hook': 'tripwire_hook',
    'redstone_wire': 'redstone_dust_dot',
    'spawner': 'spawner',
    'nether_portal': 'nether_portal',
    'end_rod': 'end_rod',
    'crying_obsidian': 'crying_obsidian',
    'sculk': 'sculk',
    'sculk_catalyst': 'sculk_catalyst_side',
    'sculk_shrieker': 'sculk_shrieker_side',
    'sculk_sensor': 'sculk_sensor_side',
    'mud': 'mud',
    'packed_mud': 'packed_mud',
    'mud_bricks': 'mud_bricks',
    'mangrove_roots': 'mangrove_roots_side',
    'muddy_mangrove_roots': 'muddy_mangrove_roots_side',
    'cherry_leaves': 'cherry_leaves',
    'pink_petals': 'pink_petals',
    'decorated_pot': 'decorated_pot_side',
    'suspicious_sand': 'suspicious_sand_0',
    'suspicious_gravel': 'suspicious_gravel_0',
  };

  if (directMap[blockId]) {
    return `${baseUrl}/${directMap[blockId]}.png`;
  }

  let name = blockId;

  // 2. Rimozione prefissi comuni (wall_, potted_, infested_, waxed_)
  const prefixes = ['wall_', 'potted_', 'infested_', 'waxed_'];
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      name = name.substring(prefix.length);
    }
  }

  // 3. Gestione suffissi per blocchi derivati (stairs, slabs, etc.)
  const suffixes = [
    '_stairs', '_slab', '_fence_gate', '_fence', '_wall', 
    '_button', '_pressure_plate', '_trapdoor', '_pane', '_sign',
    '_door', '_hanging_sign'
  ];
  
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of suffixes) {
      if (name.endsWith(suffix)) {
        name = name.substring(0, name.length - suffix.length);
        changed = true;
        break;
      }
    }
  }

  // 4. Correzioni specifiche post-rimozione
  if (name.endsWith('_wood')) name = name.replace('_wood', '_log');
  if (name.endsWith('_brick')) name += 's';
  if (name === 'brick') name = 'bricks';

  const woods = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'crimson', 'warped', 'bamboo'];
  if (woods.includes(name)) {
     if (name === 'bamboo') name = 'bamboo_planks';
     else name += '_planks';
  }

  // 5. Controllo finale nella directMap (es. sandstone_stairs -> sandstone -> sandstone_side)
  if (directMap[name]) return `${baseUrl}/${directMap[name]}.png`;

  return `${baseUrl}/${name}.png`;
};

export const fetchMinecraftVersions = async (): Promise<string[]> => {
  const defaults = ['1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.8.9'];
  try {
    // Recupera la lista delle versioni disponibili da minecraft-data
    const res = await fetch('https://cdn.jsdelivr.net/npm/minecraft-data/data/dataPaths.json');
    if (!res.ok) throw new Error('Failed to fetch versions');
    const data = await res.json();
    
    if (!data.pc) throw new Error('No PC versions found');
    
    // Filtra solo le release stabili (es. "1.20", "1.16.5") ed esclude snapshot (es. "23w04a", "1.19-pre1")
    const releases = Object.keys(data.pc).filter(v => /^\d+\.\d+(\.\d+)?$/.test(v));

    // Ordina semanticamente (SemVer)
    return releases.sort((a, b) => {
      const pa = a.split('.').map(n => parseInt(n, 10));
      const pb = b.split('.').map(n => parseInt(n, 10));
      
      for (let i = 0; i < 3; i++) {
        const numA = pa[i] || 0;
        const numB = pb[i] || 0;
        if (numA > numB) return -1;
        if (numA < numB) return 1;
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