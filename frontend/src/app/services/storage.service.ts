import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  User, 
  PlayerCharacter, 
  DataItem, 
  DataGroup, 
  GameSession, 
  ExportData,
  UserMode,
  GameSystem 
} from '../models/rpg.models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'rpg-manager-data';
  private readonly USER_KEY = 'rpg-manager-user';
  private readonly USERS_LIST_KEY = 'rpg-manager-users-list';
  private readonly CURRENT_CHARACTER_KEY = 'rpg-manager-current-character';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private currentCharacterSubject = new BehaviorSubject<PlayerCharacter | null>(null);
  public currentCharacter$ = this.currentCharacterSubject.asObservable();

  constructor() {
    this.loadCurrentUser();
    this.loadCurrentCharacter();
  }

  // Gestion de l'utilisateur
  setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    // Ajouter l'utilisateur à la liste des utilisateurs existants
    this.addUserToList(user);
    
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
        gameSystem: GameSystem.OTHER,
        userId: user.id,
        dataItems: [],
        dataGroups: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.saveCharacter(defaultCharacter);
      this.setCurrentCharacter(defaultCharacter);
    } else {
      // Si des personnages existent, charger le premier par défaut
      this.setCurrentCharacter(existingCharacters[0]);
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
    const currentCharacter = this.getCurrentCharacter();
    
    if (currentCharacter) {
      const existingIndex = currentCharacter.dataItems.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        currentCharacter.dataItems[existingIndex] = item;
      } else {
        currentCharacter.dataItems.push(item);
      }
      this.updateCharacter(currentCharacter);
    }
  }

  deleteDataItem(itemId: string, userId: string): void {
    const currentCharacter = this.getCurrentCharacter();
    if (currentCharacter) {
      currentCharacter.dataItems = currentCharacter.dataItems.filter(i => i.id !== itemId);
      this.updateCharacter(currentCharacter);
    }
  }

  // Gestion des groupes
  saveDataGroup(group: DataGroup): void {
    const currentCharacter = this.getCurrentCharacter();
    
    if (currentCharacter) {
      const existingIndex = currentCharacter.dataGroups.findIndex(g => g.id === group.id);
      if (existingIndex >= 0) {
        currentCharacter.dataGroups[existingIndex] = group;
      } else {
        currentCharacter.dataGroups.push(group);
      }
      this.updateCharacter(currentCharacter);
    }
  }

  deleteDataGroup(groupId: string, userId: string): void {
    const currentCharacter = this.getCurrentCharacter();
    if (currentCharacter) {
      currentCharacter.dataGroups = currentCharacter.dataGroups.filter(g => g.id !== groupId);
      this.updateCharacter(currentCharacter);
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
    return this.currentCharacterSubject.value;
  }

  setCurrentCharacter(character: PlayerCharacter): void {
    localStorage.setItem(this.CURRENT_CHARACTER_KEY, JSON.stringify(character));
    this.currentCharacterSubject.next(character);
  }

  clearCurrentCharacter(): void {
    localStorage.removeItem(this.CURRENT_CHARACTER_KEY);
    this.currentCharacterSubject.next(null);
  }

  private loadCurrentCharacter(): void {
    const characterData = localStorage.getItem(this.CURRENT_CHARACTER_KEY);
    if (characterData) {
      const character = JSON.parse(characterData);
      this.currentCharacterSubject.next(character);
    }
  }

  // Gestion de la liste des utilisateurs
  getAllUsers(): User[] {
    const usersData = localStorage.getItem(this.USERS_LIST_KEY);
    return usersData ? JSON.parse(usersData) : [];
  }

  private addUserToList(user: User): void {
    const users = this.getAllUsers();
    const existingUserIndex = users.findIndex(u => u.id === user.id);
    
    if (existingUserIndex >= 0) {
      // Mettre à jour l'utilisateur existant
      users[existingUserIndex] = user;
    } else {
      // Ajouter le nouvel utilisateur
      users.push(user);
    }
    
    localStorage.setItem(this.USERS_LIST_KEY, JSON.stringify(users));
  }

  findUserByUsername(username: string, mode: UserMode): User | null {
    const users = this.getAllUsers();
    return users.find(u => u.username === username && u.mode === mode) || null;
  }

  deleteUser(userId: string): void {
    // Supprimer l'utilisateur de la liste
    const users = this.getAllUsers().filter(u => u.id !== userId);
    localStorage.setItem(this.USERS_LIST_KEY, JSON.stringify(users));
    
    // Supprimer les données de l'utilisateur
    const data = this.getStorageData();
    if (data.characters) {
      data.characters = data.characters.filter((c: PlayerCharacter) => c.userId !== userId);
    }
    if (data.gameSessions) {
      data.gameSessions = data.gameSessions.filter((s: GameSession) => s.gameMasterId !== userId);
    }
    this.setStorageData(data);
    
    // Si c'est l'utilisateur actuel, le déconnecter
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      this.clearCurrentUser();
      this.clearCurrentCharacter();
    }
  }

  // Gestion avancée des personnages
  createNewCharacter(name: string, gameSystem: GameSystem, userId: string): PlayerCharacter {
    const newCharacter: PlayerCharacter = {
      id: this.generateId(),
      name: name.trim(),
      gameSystem,
      userId,
      dataItems: [],
      dataGroups: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.saveCharacter(newCharacter);
    return newCharacter;
  }

  updateCharacter(character: PlayerCharacter): void {
    character.updatedAt = new Date();
    this.saveCharacter(character);
    
    // Si c'est le personnage actuel, le mettre à jour aussi
    const currentCharacter = this.getCurrentCharacter();
    if (currentCharacter && currentCharacter.id === character.id) {
      this.setCurrentCharacter(character);
    }
  }

  // Méthodes pour la gestion des joueurs (GM)
  getUsers(): User[] {
    const usersData = localStorage.getItem(this.USERS_LIST_KEY);
    return usersData ? JSON.parse(usersData) : [];
  }

  getUserCharacters(username: string): PlayerCharacter[] {
    const users = this.getUsers();
    const user = users.find(u => u.username === username);
    if (!user) return [];
    
    return this.getCharacters(user.id);
  }

  getCharacterData(characterId: string): any {
    const key = `${this.STORAGE_KEY}-${characterId}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    
    // Retourner une structure par défaut si aucune donnée n'existe
    return {
      dataGroups: {
        'top': { name: 'Haut', items: [] },
        'left': { name: 'Gauche', items: [] },
        'center': { name: 'Centre', items: [] },
        'right': { name: 'Droite', items: [] },
        'bottom': { name: 'Bas', items: [] }
      }
    };
  }
}