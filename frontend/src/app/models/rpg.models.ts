// Énumérations
export enum UserMode {
  PLAYER = 'player',
  GAMEMASTER = 'gamemaster'
}

export enum DashboardZone {
  TOP = 'top',
  LEFT = 'left',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  CENTER = 'center'
}

export enum DataType {
  NUMERIC = 'numeric',
  TEXT = 'text'
}

// Interfaces principales
export interface User {
  id: string;
  username: string;
  mode: UserMode;
  createdAt: Date;
}

export interface DataItem {
  id: string;
  name: string;
  type: DataType;
  value: string | number;
  description?: string;
  zone: DashboardZone;
  groupId?: string;
  order: number;
  userId: string;
}

export interface DataGroup {
  id: string;
  name: string;
  zone: DashboardZone;
  items: DataItem[];
  order: number;
  userId: string;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  userId: string;
  dataItems: DataItem[];
  dataGroups: DataGroup[];
}

export interface CombatParticipant {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
  characterId?: string;
  healthPoints?: number;
  maxHealthPoints?: number;
}

export interface CombatSession {
  id: string;
  name: string;
  participants: CombatParticipant[];
  currentTurn: number;
  round: number;
  isActive: boolean;
  gameMasterId: string;
}

export interface GameSession {
  id: string;
  name: string;
  gameMasterId: string;
  players: PlayerCharacter[];
  combat?: CombatSession;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour l'export/import
export interface ExportData {
  version: string;
  exportDate: Date;
  user: User;
  characters: PlayerCharacter[];
  gameSessions?: GameSession[];
}