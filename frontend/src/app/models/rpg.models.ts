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
  TEXT = 'text',
  ATTRIBUTE = 'attribute',
  PROFICIENCY_BONUS = 'proficiency_bonus'
}

export enum GameSystem {
  DND5E = 'dnd5e',
  PATHFINDER = 'pathfinder',
  CHRONIQUES_OUBLIEES = 'chroniques_oubliees',
  CALL_OF_CTHULHU = 'call_of_cthulhu',
  VAMPIRE = 'vampire',
  SHADOWRUN = 'shadowrun',
  CYBERPUNK = 'cyberpunk',
  STAR_WARS = 'star_wars',
  WARHAMMER = 'warhammer',
  SAVAGE_WORLDS = 'savage_worlds',
  FATE = 'fate',
  GURPS = 'gurps',
  OTHER = 'other'
}

// Labels pour les systèmes de jeu
export const GAME_SYSTEM_LABELS: Record<GameSystem, string> = {
  [GameSystem.DND5E]: 'Donjons & Dragons 5e',
  [GameSystem.PATHFINDER]: 'Pathfinder',
  [GameSystem.CHRONIQUES_OUBLIEES]: 'Chroniques Oubliées',
  [GameSystem.CALL_OF_CTHULHU]: 'L\'Appel de Cthulhu',
  [GameSystem.VAMPIRE]: 'Vampire: La Mascarade',
  [GameSystem.SHADOWRUN]: 'Shadowrun',
  [GameSystem.CYBERPUNK]: 'Cyberpunk',
  [GameSystem.STAR_WARS]: 'Star Wars RPG',
  [GameSystem.WARHAMMER]: 'Warhammer Fantasy',
  [GameSystem.SAVAGE_WORLDS]: 'Savage Worlds',
  [GameSystem.FATE]: 'Fate Core',
  [GameSystem.GURPS]: 'GURPS',
  [GameSystem.OTHER]: 'Autre système'
};

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
  // Propriétés spécifiques aux attributs
  hasProficiency?: boolean;
  modifier?: number;
  savingThrow?: number;
  // Référence vers le bonus de maîtrise si nécessaire
  proficiencyBonusRef?: string;
  // Propriétés pour les éléments numériques modifiables
  allowQuickModification?: boolean;
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
  gameSystem: GameSystem;
  userId: string;
  dataItems: DataItem[];
  dataGroups: DataGroup[];
  createdAt: Date;
  updatedAt: Date;
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