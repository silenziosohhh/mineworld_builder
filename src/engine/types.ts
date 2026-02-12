export interface User {
  id: string;
  username: string;
  email: string;
}

export type Vector3Tuple = [number, number, number];

export interface BlockData {
  id: string;
  position: Vector3Tuple;
  color: string;
  type: string;
  texture?: string;
}

export interface WorldData {
  id: string;
  name: string;
  createdAt: string;
  blocks: BlockData[];
}

export interface BlockDefinition {
  id: string;
  name: string;
  color: string;
  texture?: string;
}