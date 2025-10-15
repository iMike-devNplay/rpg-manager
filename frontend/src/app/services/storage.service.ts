import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  User, 
  PlayerCharacter, 
  DataItem, 
  DataGroup, 
  GameSession, 
  ExportData,
  UserMode 
} from '../models/rpg.models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'rpg-manager-data';
  private readonly USER_KEY = 'rpg-manager-user';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadCurrentUser();
  }

  // Gestion de l'utilisateur
  setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    // Créer un personnage par défaut si aucun n'existe
    this.ensureDefaultCharacter(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private loadCurrentUser(): void {
    const userData = localStorage.getItem(this.USER_KEY);
    if (userData) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);
    }
  }

  clearCurrentUser(): void {
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  // Créer un personnage par défaut si aucun n'existe
  private ensureDefaultCharacter(user: User): void {
    const existingCharacters = this.getCharacters(user.id);
    if (existingCharacters.length === 0) {
      const defaultCharacter: PlayerCharacter = {
        id: this.generateId(),
        name: `Personnage de ${user.username}`,
        userId: user.id,
        dataItems: [],
        dataGroups: []
      };
      this.saveCharacter(defaultCharacter);
    }
  }

  // Gestion des données générales
  private getStorageData(): any {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private setStorageData(data: any): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Gestion des personnages
  saveCharacter(character: PlayerCharacter): void {
    const data = this.getStorageData();
    if (!data.characters) data.characters = [];
    
    const existingIndex = data.characters.findIndex((c: PlayerCharacter) => c.id === character.id);
    if (existingIndex >= 0) {
      data.characters[existingIndex] = character;
    } else {
      data.characters.push(character);
    }
    
    this.setStorageData(data);
  }

  getCharacters(userId: string): PlayerCharacter[] {
    const data = this.getStorageData();
    return data.characters ? data.characters.filter((c: PlayerCharacter) => c.userId === userId) : [];
  }

  deleteCharacter(characterId: string): void {
    const data = this.getStorageData();
    if (data.characters) {
      data.characters = data.characters.filter((c: PlayerCharacter) => c.id !== characterId);
      this.setStorageData(data);
    }
  }

  // Gestion des éléments de données
  saveDataItem(item: DataItem): void {
    const characters = this.getCharacters(item.userId);
    let character = characters.length > 0 ? characters[0] : null;
    
    // Si aucun personnage n'existe, en créer un
    if (!character) {
      const user = this.getCurrentUser();
      if (user) {
        this.ensureDefaultCharacter(user);
        character = this.getCharacters(item.userId)[0];
      }
    }
    
    if (character) {
      const existingIndex = character.dataItems.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        character.dataItems[existingIndex] = item;
      } else {
        character.dataItems.push(item);
      }
      this.saveCharacter(character);
    }
  }

  deleteDataItem(itemId: string, userId: string): void {
    const characters = this.getCharacters(userId);
    if (characters.length > 0) {
      const character = characters[0];
      character.dataItems = character.dataItems.filter(i => i.id !== itemId);
      this.saveCharacter(character);
    }
  }

  // Gestion des groupes
  saveDataGroup(group: DataGroup): void {
    const characters = this.getCharacters(group.userId);
    let character = characters.length > 0 ? characters[0] : null;
    
    // Si aucun personnage n'existe, en créer un
    if (!character) {
      const user = this.getCurrentUser();
      if (user) {
        this.ensureDefaultCharacter(user);
        character = this.getCharacters(group.userId)[0];
      }
    }
    
    if (character) {
      const existingIndex = character.dataGroups.findIndex(g => g.id === group.id);
      if (existingIndex >= 0) {
        character.dataGroups[existingIndex] = group;
      } else {
        character.dataGroups.push(group);
      }
      this.saveCharacter(character);
    }
  }

  deleteDataGroup(groupId: string, userId: string): void {
    const characters = this.getCharacters(userId);
    if (characters.length > 0) {
      const character = characters[0];
      character.dataGroups = character.dataGroups.filter(g => g.id !== groupId);
      this.saveCharacter(character);
    }
  }

  // Gestion des sessions de jeu (pour les maîtres de jeu)
  saveGameSession(session: GameSession): void {
    const data = this.getStorageData();
    if (!data.gameSessions) data.gameSessions = [];
    
    const existingIndex = data.gameSessions.findIndex((s: GameSession) => s.id === session.id);
    if (existingIndex >= 0) {
      data.gameSessions[existingIndex] = session;
    } else {
      data.gameSessions.push(session);
    }
    
    this.setStorageData(data);
  }

  getGameSessions(gameMasterId: string): GameSession[] {
    const data = this.getStorageData();
    return data.gameSessions ? data.gameSessions.filter((s: GameSession) => s.gameMasterId === gameMasterId) : [];
  }

  // Export/Import
  exportData(): ExportData {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Aucun utilisateur connecté');

    const characters = this.getCharacters(user.id);
    const gameSessions = user.mode === UserMode.GAMEMASTER ? this.getGameSessions(user.id) : undefined;

    return {
      version: '1.0.0',
      exportDate: new Date(),
      user,
      characters,
      gameSessions
    };
  }

  importData(exportData: ExportData): void {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Aucun utilisateur connecté');

    // Importer les personnages
    exportData.characters.forEach(character => {
      character.userId = user.id; // Réassigner à l'utilisateur actuel
      this.saveCharacter(character);
    });

    // Importer les sessions de jeu si l'utilisateur est maître de jeu
    if (user.mode === UserMode.GAMEMASTER && exportData.gameSessions) {
      exportData.gameSessions.forEach(session => {
        session.gameMasterId = user.id; // Réassigner à l'utilisateur actuel
        this.saveGameSession(session);
      });
    }
  }

  // Utilitaires
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obtenir le personnage actuel de l'utilisateur connecté
  getCurrentCharacter(): PlayerCharacter | null {
    const user = this.getCurrentUser();
    if (user) {
      const characters = this.getCharacters(user.id);
      return characters.length > 0 ? characters[0] : null;
    }
    return null;
  }
}