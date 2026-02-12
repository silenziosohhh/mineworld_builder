import type { Vector3Tuple } from './types';

export const snapToGrid = (x: number, y: number, z: number): Vector3Tuple => {
  return [Math.floor(x) + 0.5, Math.floor(y) + 0.5, Math.floor(z) + 0.5];
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getBlockKey = (position: Vector3Tuple): string => {
  return `${position[0]},${position[1]},${position[2]}`;
};

const getTextureUrl = (id: string) => {
  const version = '1.20.1';
  const baseUrl = `https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@${version}/assets/minecraft/textures/block`;
  if (id === 'grass_block') return `${baseUrl}/grass_block_side.png`;
  return `${baseUrl}/${id}.png`;
};

// Questa lista ora serve principalmente come mappa colori e fallback iniziale
const RAW_BLOCKS = [
  // Natural
  { id: 'grass_block', name: 'Grass Block', color: '#79C05A' },
  { id: 'dirt', name: 'Dirt', color: '#866043' },
  { id: 'coarse_dirt', name: 'Coarse Dirt', color: '#77553B' },
  { id: 'podzol', name: 'Podzol', color: '#593D29' },
  { id: 'stone', name: 'Stone', color: '#7D7D7D' },
  { id: 'cobblestone', name: 'Cobblestone', color: '#505050' },
  { id: 'mossy_cobblestone', name: 'Mossy Cobblestone', color: '#495A49' },
  { id: 'granite', name: 'Granite', color: '#956756' },
  { id: 'diorite', name: 'Diorite', color: '#AFAFAF' },
  { id: 'andesite', name: 'Andesite', color: '#878787' },
  { id: 'deepslate', name: 'Deepslate', color: '#515151' },
  { id: 'cobbled_deepslate', name: 'Cobbled Deepslate', color: '#4D4D50' },
  { id: 'tuff', name: 'Tuff', color: '#6C6D66' },
  { id: 'sand', name: 'Sand', color: '#DBD3A0' },
  { id: 'red_sand', name: 'Red Sand', color: '#BF6721' },
  { id: 'gravel', name: 'Gravel', color: '#858383' },
  { id: 'clay', name: 'Clay', color: '#A0A6B3' },
  { id: 'snow_block', name: 'Snow Block', color: '#F9FEFE' },
  { id: 'ice', name: 'Ice', color: '#9FD8FA', opacity: 0.6 },
  { id: 'packed_ice', name: 'Packed Ice', color: '#A4C8E8' },
  { id: 'blue_ice', name: 'Blue Ice', color: '#74A7FD' },

  // Wood (Planks & Logs)
  { id: 'oak_planks', name: 'Oak Planks', color: '#A2824E' },
  { id: 'oak_log', name: 'Oak Log', color: '#6B5130' },
  { id: 'spruce_planks', name: 'Spruce Planks', color: '#715331' },
  { id: 'spruce_log', name: 'Spruce Log', color: '#3B2613' },
  { id: 'birch_planks', name: 'Birch Planks', color: '#C4B079' },
  { id: 'birch_log', name: 'Birch Log', color: '#D7D7D7' },
  { id: 'jungle_planks', name: 'Jungle Planks', color: '#A07350' },
  { id: 'jungle_log', name: 'Jungle Log', color: '#554419' },
  { id: 'acacia_planks', name: 'Acacia Planks', color: '#A85A32' },
  { id: 'acacia_log', name: 'Acacia Log', color: '#675F57' },
  { id: 'dark_oak_planks', name: 'Dark Oak Planks', color: '#422B15' },
  { id: 'dark_oak_log', name: 'Dark Oak Log', color: '#2F2113' },
  { id: 'mangrove_planks', name: 'Mangrove Planks', color: '#753630' },
  { id: 'mangrove_log', name: 'Mangrove Log', color: '#522925' },
  { id: 'cherry_planks', name: 'Cherry Planks', color: '#E5B2CA' },
  { id: 'cherry_log', name: 'Cherry Log', color: '#2A181C' },
  { id: 'bamboo_planks', name: 'Bamboo Planks', color: '#E2C762' },
  { id: 'bamboo_block', name: 'Bamboo Block', color: '#68862F' },

  // Leaves
  { id: 'oak_leaves', name: 'Oak Leaves', color: '#3A6F2B', opacity: 0.9 },
  { id: 'spruce_leaves', name: 'Spruce Leaves', color: '#365837', opacity: 0.9 },
  { id: 'birch_leaves', name: 'Birch Leaves', color: '#587C38', opacity: 0.9 },
  { id: 'jungle_leaves', name: 'Jungle Leaves', color: '#228C1F', opacity: 0.9 },
  { id: 'acacia_leaves', name: 'Acacia Leaves', color: '#467D27', opacity: 0.9 },
  { id: 'dark_oak_leaves', name: 'Dark Oak Leaves', color: '#228C1F', opacity: 0.9 },
  { id: 'mangrove_leaves', name: 'Mangrove Leaves', color: '#228C1F', opacity: 0.9 },
  { id: 'cherry_leaves', name: 'Cherry Leaves', color: '#F48FB1', opacity: 0.9 },
  { id: 'azalea_leaves', name: 'Azalea Leaves', color: '#5D8832', opacity: 0.9 },
  { id: 'flowering_azalea_leaves', name: 'Flowering Azalea Leaves', color: '#8F5E7B', opacity: 0.9 },

  // Ores & Minerals
  { id: 'coal_ore', name: 'Coal Ore', color: '#343434' },
  { id: 'iron_ore', name: 'Iron Ore', color: '#D8AF93' },
  { id: 'copper_ore', name: 'Copper Ore', color: '#E0734D' },
  { id: 'gold_ore', name: 'Gold Ore', color: '#FCEE4B' },
  { id: 'redstone_ore', name: 'Redstone Ore', color: '#FF0000' },
  { id: 'emerald_ore', name: 'Emerald Ore', color: '#17DD62' },
  { id: 'lapis_ore', name: 'Lapis Lazuli Ore', color: '#1C4D9C' },
  { id: 'diamond_ore', name: 'Diamond Ore', color: '#5DECF5' },
  { id: 'nether_gold_ore', name: 'Nether Gold Ore', color: '#FCEE4B' },
  { id: 'nether_quartz_ore', name: 'Nether Quartz Ore', color: '#EAE5DE' },
  { id: 'ancient_debris', name: 'Ancient Debris', color: '#5E4239' },
  { id: 'coal_block', name: 'Block of Coal', color: '#121212' },
  { id: 'iron_block', name: 'Block of Iron', color: '#D8D8D8' },
  { id: 'copper_block', name: 'Block of Copper', color: '#C06C50' },
  { id: 'gold_block', name: 'Block of Gold', color: '#F9D92F' },
  { id: 'redstone_block', name: 'Block of Redstone', color: '#D90606' },
  { id: 'emerald_block', name: 'Block of Emerald', color: '#28D663' },
  { id: 'lapis_block', name: 'Block of Lapis Lazuli', color: '#1C4D9C' },
  { id: 'diamond_block', name: 'Block of Diamond', color: '#63EBE9' },
  { id: 'netherite_block', name: 'Block of Netherite', color: '#443F41' },
  { id: 'quartz_block', name: 'Block of Quartz', color: '#EAE5DE' },
  { id: 'amethyst_block', name: 'Block of Amethyst', color: '#8965C3' },

  // Manufactured
  { id: 'bricks', name: 'Bricks', color: '#966254' },
  { id: 'stone_bricks', name: 'Stone Bricks', color: '#797979' },
  { id: 'mossy_stone_bricks', name: 'Mossy Stone Bricks', color: '#737A6D' },
  { id: 'cracked_stone_bricks', name: 'Cracked Stone Bricks', color: '#767676' },
  { id: 'chiseled_stone_bricks', name: 'Chiseled Stone Bricks', color: '#777777' },
  { id: 'mud_bricks', name: 'Mud Bricks', color: '#8A6756' },
  { id: 'deepslate_bricks', name: 'Deepslate Bricks', color: '#484849' },
  { id: 'deepslate_tiles', name: 'Deepslate Tiles', color: '#383838' },
  { id: 'polished_deepslate', name: 'Polished Deepslate', color: '#484849' },
  { id: 'polished_granite', name: 'Polished Granite', color: '#9A6A59' },
  { id: 'polished_diorite', name: 'Polished Diorite', color: '#C4C4C4' },
  { id: 'polished_andesite', name: 'Polished Andesite', color: '#848685' },
  { id: 'smooth_stone', name: 'Smooth Stone', color: '#A0A0A0' },
  { id: 'smooth_sandstone', name: 'Smooth Sandstone', color: '#DBD3A0' },
  { id: 'smooth_red_sandstone', name: 'Smooth Red Sandstone', color: '#BF6721' },
  { id: 'cut_sandstone', name: 'Cut Sandstone', color: '#D8CF9C' },
  { id: 'cut_red_sandstone', name: 'Cut Red Sandstone', color: '#BC6520' },
  { id: 'obsidian', name: 'Obsidian', color: '#14121D' },
  { id: 'crying_obsidian', name: 'Crying Obsidian', color: '#280E3D' },
  { id: 'bedrock', name: 'Bedrock', color: '#555555' },

  // Nether
  { id: 'netherrack', name: 'Netherrack', color: '#672828' },
  { id: 'crimson_nylium', name: 'Crimson Nylium', color: '#881818' },
  { id: 'warped_nylium', name: 'Warped Nylium', color: '#16615B' },
  { id: 'soul_sand', name: 'Soul Sand', color: '#48382E' },
  { id: 'soul_soil', name: 'Soul Soil', color: '#48382E' },
  { id: 'basalt', name: 'Basalt', color: '#4F4B4F' },
  { id: 'polished_basalt', name: 'Polished Basalt', color: '#5B575B' },
  { id: 'smooth_basalt', name: 'Smooth Basalt', color: '#424242' },
  { id: 'blackstone', name: 'Blackstone', color: '#2A2327' },
  { id: 'polished_blackstone', name: 'Polished Blackstone', color: '#332B30' },
  { id: 'polished_blackstone_bricks', name: 'Polished Blackstone Bricks', color: '#282226' },
  { id: 'gilded_blackstone', name: 'Gilded Blackstone', color: '#3C3026' },
  { id: 'crimson_planks', name: 'Crimson Planks', color: '#632533' },
  { id: 'warped_planks', name: 'Warped Planks', color: '#2B6863' },
  { id: 'crimson_stem', name: 'Crimson Stem', color: '#4D1016' },
  { id: 'warped_stem', name: 'Warped Stem', color: '#295754' },
  { id: 'nether_bricks', name: 'Nether Bricks', color: '#2C151A' },
  { id: 'red_nether_bricks', name: 'Red Nether Bricks', color: '#42080D' },
  { id: 'glowstone', name: 'Glowstone', color: '#FAD676' },
  { id: 'shroomlight', name: 'Shroomlight', color: '#F08D4D' },
  { id: 'magma_block', name: 'Magma Block', color: '#8E3F1F' },

  // End
  { id: 'end_stone', name: 'End Stone', color: '#DFE5AA' },
  { id: 'end_stone_bricks', name: 'End Stone Bricks', color: '#DCE1A5' },
  { id: 'purpur_block', name: 'Purpur Block', color: '#A97CA9' },
  { id: 'purpur_pillar', name: 'Purpur Pillar', color: '#AB7EAB' },

  // Wool
  { id: 'white_wool', name: 'White Wool', color: '#E9ECEC' },
  { id: 'orange_wool', name: 'Orange Wool', color: '#F07613' },
  { id: 'magenta_wool', name: 'Magenta Wool', color: '#BD44B3' },
  { id: 'light_blue_wool', name: 'Light Blue Wool', color: '#3AAFD9' },
  { id: 'yellow_wool', name: 'Yellow Wool', color: '#F8C627' },
  { id: 'lime_wool', name: 'Lime Wool', color: '#70B919' },
  { id: 'pink_wool', name: 'Pink Wool', color: '#ED8DAC' },
  { id: 'gray_wool', name: 'Gray Wool', color: '#3E4447' },
  { id: 'light_gray_wool', name: 'Light Gray Wool', color: '#8E8E86' },
  { id: 'cyan_wool', name: 'Cyan Wool', color: '#158991' },
  { id: 'purple_wool', name: 'Purple Wool', color: '#792AAC' },
  { id: 'blue_wool', name: 'Blue Wool', color: '#35399D' },
  { id: 'brown_wool', name: 'Brown Wool', color: '#724728' },
  { id: 'green_wool', name: 'Green Wool', color: '#546D1B' },
  { id: 'red_wool', name: 'Red Wool', color: '#A12722' },
  { id: 'black_wool', name: 'Black Wool', color: '#141519' },

  // Concrete
  { id: 'white_concrete', name: 'White Concrete', color: '#CFD5D6' },
  { id: 'orange_concrete', name: 'Orange Concrete', color: '#E06100' },
  { id: 'magenta_concrete', name: 'Magenta Concrete', color: '#A9309F' },
  { id: 'light_blue_concrete', name: 'Light Blue Concrete', color: '#2389C6' },
  { id: 'yellow_concrete', name: 'Yellow Concrete', color: '#F0AF15' },
  { id: 'lime_concrete', name: 'Lime Concrete', color: '#5EA818' },
  { id: 'pink_concrete', name: 'Pink Concrete', color: '#D5658E' },
  { id: 'gray_concrete', name: 'Gray Concrete', color: '#36393D' },
  { id: 'light_gray_concrete', name: 'Light Gray Concrete', color: '#7D7D73' },
  { id: 'cyan_concrete', name: 'Cyan Concrete', color: '#157788' },
  { id: 'purple_concrete', name: 'Purple Concrete', color: '#641F9C' },
  { id: 'blue_concrete', name: 'Blue Concrete', color: '#2C2E8F' },
  { id: 'brown_concrete', name: 'Brown Concrete', color: '#603B1F' },
  { id: 'green_concrete', name: 'Green Concrete', color: '#495B24' },
  { id: 'red_concrete', name: 'Red Concrete', color: '#8E2020' },
  { id: 'black_concrete', name: 'Black Concrete', color: '#080A0F' },

  // Glass
  { id: 'glass', name: 'Glass', color: '#FFFFFF', opacity: 0.3 },
  { id: 'white_stained_glass', name: 'White Stained Glass', color: '#FFFFFF', opacity: 0.4 },
  { id: 'orange_stained_glass', name: 'Orange Stained Glass', color: '#D87F33', opacity: 0.4 },
  { id: 'magenta_stained_glass', name: 'Magenta Stained Glass', color: '#B24CD8', opacity: 0.4 },
  { id: 'light_blue_stained_glass', name: 'Light Blue Stained Glass', color: '#6699D8', opacity: 0.4 },
  { id: 'yellow_stained_glass', name: 'Yellow Stained Glass', color: '#E5E533', opacity: 0.4 },
  { id: 'lime_stained_glass', name: 'Lime Stained Glass', color: '#7FCC19', opacity: 0.4 },
  { id: 'pink_stained_glass', name: 'Pink Stained Glass', color: '#F27FA5', opacity: 0.4 },
  { id: 'gray_stained_glass', name: 'Gray Stained Glass', color: '#4C4C4C', opacity: 0.4 },
  { id: 'light_gray_stained_glass', name: 'Light Gray Stained Glass', color: '#999999', opacity: 0.4 },
  { id: 'cyan_stained_glass', name: 'Cyan Stained Glass', color: '#4C7F99', opacity: 0.4 },
  { id: 'purple_stained_glass', name: 'Purple Stained Glass', color: '#7F3FB2', opacity: 0.4 },
  { id: 'blue_stained_glass', name: 'Blue Stained Glass', color: '#334CB2', opacity: 0.4 },
  { id: 'brown_stained_glass', name: 'Brown Stained Glass', color: '#664C33', opacity: 0.4 },
  { id: 'green_stained_glass', name: 'Green Stained Glass', color: '#667F33', opacity: 0.4 },
  { id: 'red_stained_glass', name: 'Red Stained Glass', color: '#993333', opacity: 0.4 },
  { id: 'black_stained_glass', name: 'Black Stained Glass', color: '#191919', opacity: 0.4 },
  { id: 'tinted_glass', name: 'Tinted Glass', color: '#2A2327', opacity: 0.6 },

  // Terracotta
  { id: 'terracotta', name: 'Terracotta', color: '#965D42' },
  { id: 'white_terracotta', name: 'White Terracotta', color: '#D1B2A1' },
  { id: 'orange_terracotta', name: 'Orange Terracotta', color: '#A15325' },
  { id: 'magenta_terracotta', name: 'Magenta Terracotta', color: '#95586C' },
  { id: 'light_blue_terracotta', name: 'Light Blue Terracotta', color: '#716C89' },
  { id: 'yellow_terracotta', name: 'Yellow Terracotta', color: '#BA8523' },
  { id: 'lime_terracotta', name: 'Lime Terracotta', color: '#677534' },
  { id: 'pink_terracotta', name: 'Pink Terracotta', color: '#A14E4E' },
  { id: 'gray_terracotta', name: 'Gray Terracotta', color: '#392A24' },
  { id: 'light_gray_terracotta', name: 'Light Gray Terracotta', color: '#876A61' },
  { id: 'cyan_terracotta', name: 'Cyan Terracotta', color: '#565B5B' },
  { id: 'purple_terracotta', name: 'Purple Terracotta', color: '#764556' },
  { id: 'blue_terracotta', name: 'Blue Terracotta', color: '#4A3C5B' },
  { id: 'brown_terracotta', name: 'Brown Terracotta', color: '#4C3323' },
  { id: 'green_terracotta', name: 'Green Terracotta', color: '#4C532A' },
  { id: 'red_terracotta', name: 'Red Terracotta', color: '#8E3C2E' },
  { id: 'black_terracotta', name: 'Black Terracotta', color: '#251610' },

  // Other
  { id: 'sponge', name: 'Sponge', color: '#C3C345' },
  { id: 'wet_sponge', name: 'Wet Sponge', color: '#8E8E34' },
  { id: 'slime_block', name: 'Slime Block', color: '#72C167', opacity: 0.8 },
  { id: 'honey_block', name: 'Honey Block', color: '#F09C2D', opacity: 0.8 },
  { id: 'sea_lantern', name: 'Sea Lantern', color: '#ACD6D0' },
  { id: 'prismarine', name: 'Prismarine', color: '#629B96' },
  { id: 'prismarine_bricks', name: 'Prismarine Bricks', color: '#63AB9E' },
  { id: 'dark_prismarine', name: 'Dark Prismarine', color: '#345B4C' },
];

export const INITIAL_BLOCKS = RAW_BLOCKS.map(block => ({
  ...block,
  texture: getTextureUrl(block.id)
}));

// Creiamo una mappa ID -> Colore per applicare i colori corretti ai dati dell'API
export const BLOCK_COLOR_MAP: Record<string, string> = INITIAL_BLOCKS.reduce((acc, block) => {
  acc[block.id] = block.color;
  return acc;
}, {} as Record<string, string>);

// Manteniamo l'export per compatibilità, ma lo rinominiamo concettualmente
export const MINECRAFT_BLOCKS = INITIAL_BLOCKS;

export const MINECRAFT_VERSIONS = ['1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.8.9'];

export const COLORS = {
  grass: '#5b8c38',
  dirt: '#855e42',
  stone: '#7d7d7d',
  wood: '#a2824e',
  highlight: '#ffffff',
};