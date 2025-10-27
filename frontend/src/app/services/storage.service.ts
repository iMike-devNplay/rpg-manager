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
  GameSystem,
  DashboardTab,
  TabIcon,
  DashboardZone
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
    // Supprimer aussi le personnage courant lors de la déconnexion
    this.clearCurrentCharacter();
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
    // Removed debug logging for production readiness
    const currentCharacter = this.getCurrentCharacter();

    if (currentCharacter) {
      const existingIndex = currentCharacter.dataItems.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        const oldItem = currentCharacter.dataItems[existingIndex];

        // Préserver les metadata de l'ancien item et ne mettre à jour que ce qui change
        currentCharacter.dataItems[existingIndex] = {
          ...oldItem,
          ...item,
          metadata: {
            ...(oldItem.metadata || {}),
            ...(item.metadata || {})
          }
        };
      } else {
        currentCharacter.dataItems.push({...item});
      }

      this.updateCharacter(currentCharacter);
    } else {
      console.error('No current character found when saving data item');
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
    // Refresh from master storage if available, otherwise use provided character
    const data = this.getStorageData();
    const freshCharacter = data.characters?.find((c: PlayerCharacter) => c.id === character.id);

    if (freshCharacter) {
      localStorage.setItem(this.CURRENT_CHARACTER_KEY, JSON.stringify(freshCharacter));
      this.currentCharacterSubject.next(freshCharacter);
    } else {
      console.warn('Character not found in storage, using provided character');
      localStorage.setItem(this.CURRENT_CHARACTER_KEY, JSON.stringify(character));
      this.currentCharacterSubject.next(character);
    }
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
    const characterId = this.generateId();
    
    // Créer l'onglet par défaut
    const defaultTab: DashboardTab = {
      id: this.generateId(),
      name: 'Principal',
      icon: '📊',
      order: 0,
      characterId
    };
    
    const newCharacter: PlayerCharacter = {
      id: characterId,
      name: name.trim(),
      gameSystem,
      userId,
      dataItems: [],
      dataGroups: [],
      dashboardTabs: [defaultTab],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.saveCharacter(newCharacter);
    return newCharacter;
  }

  updateCharacter(character: PlayerCharacter): void {
    // Update and persist character
    character.updatedAt = new Date();
    this.saveCharacter(character);

    // If it's the current character, refresh it
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

  // ============================================
  // Gestion des onglets du dashboard
  // ============================================

  /**
   * Récupère les onglets d'un personnage
   */
  getDashboardTabs(characterId: string): DashboardTab[] {
    // Récupérer tous les personnages sans filtrer par userId
    const data = this.getStorageData();
    const characters: PlayerCharacter[] = data.characters || [];
    const character = characters.find(c => c.id === characterId);

    if (character?.dashboardTabs && character.dashboardTabs.length > 0) {
      // Trier les onglets par ordre
      const sortedTabs = [...character.dashboardTabs].sort((a, b) => a.order - b.order);
      return sortedTabs;
    }

    // Si aucun onglet n'existe, créer un onglet par défaut
    return this.createDefaultTab(characterId);
  }

  /**
   * Crée un onglet par défaut
   */
  private createDefaultTab(characterId: string): DashboardTab[] {
    const defaultTab: DashboardTab = {
      id: this.generateId(),
      name: 'Principal',
      icon: '📊',
      order: 0,
      characterId
    };
    
    // Sauvegarder l'onglet par défaut
    this.saveDashboardTabs(characterId, [defaultTab]);
    
    return [defaultTab];
  }

  /**
   * Sauvegarde les onglets d'un personnage
   */
  saveDashboardTabs(characterId: string, tabs: DashboardTab[]): void {
    const data = this.getStorageData();
    if (!data.characters) return;

    const characterIndex = data.characters.findIndex((c: PlayerCharacter) => c.id === characterId);
    if (characterIndex !== -1) {
      data.characters[characterIndex].dashboardTabs = tabs;
      data.characters[characterIndex].updatedAt = new Date();
      this.setStorageData(data);

      // Mettre à jour le personnage courant si c'est celui-ci
      if (this.currentCharacterSubject.value?.id === characterId) {
        this.setCurrentCharacter(data.characters[characterIndex]);
      }
    }
  }

  /**
   * Ajoute un nouvel onglet
   */
  addDashboardTab(characterId: string, name: string, icon: TabIcon): DashboardTab {
    const tabs = this.getDashboardTabs(characterId);
    
    // Limiter à 5 onglets maximum
    if (tabs.length >= 5) {
      throw new Error('Nombre maximum d\'onglets atteint (5)');
    }
    
    const newTab: DashboardTab = {
      id: this.generateId(),
      name,
      icon,
      order: tabs.length,
      characterId
    };
    
    tabs.push(newTab);
    this.saveDashboardTabs(characterId, tabs);
    
    return newTab;
  }

  /**
   * Met à jour un onglet existant
   */
  updateDashboardTab(characterId: string, tabId: string, updates: Partial<DashboardTab>): void {
    const tabs = this.getDashboardTabs(characterId);
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    
    if (tabIndex !== -1) {
      tabs[tabIndex] = { ...tabs[tabIndex], ...updates };
      this.saveDashboardTabs(characterId, tabs);
    }
  }

  /**
   * Supprime un onglet (seulement s'il est vide)
   */
  deleteDashboardTab(characterId: string, tabId: string): boolean {
    const tabs = this.getDashboardTabs(characterId);
    
    // Ne pas permettre de supprimer le dernier onglet
    if (tabs.length <= 1) {
      return false;
    }
    
    // Vérifier que l'onglet est vide
    const data = this.getStorageData();
    const characters: PlayerCharacter[] = data.characters || [];
    const character = characters.find(c => c.id === characterId);
    const hasItems = character?.dataItems.some(item => item.tabId === tabId);
    
    if (hasItems) {
      return false; // Ne pas supprimer un onglet avec des éléments
    }
    
    // Supprimer l'onglet et réorganiser les ordres
    const filteredTabs = tabs.filter(t => t.id !== tabId);
    filteredTabs.forEach((tab, index) => {
      tab.order = index;
    });
    
    this.saveDashboardTabs(characterId, filteredTabs);
    return true;
  }

  /**
   * Migration des anciennes zones vers le système d'onglets
   */
  migrateLegacyZonesToTabs(character: PlayerCharacter): PlayerCharacter {
    // Si le personnage a déjà des onglets, ne rien faire
    if (character.dashboardTabs && character.dashboardTabs.length > 0) {
      return character;
    }

    // Créer des onglets basés sur les zones existantes
    const tabs: DashboardTab[] = [];
    const zoneMapping: Record<string, { name: string; icon: TabIcon; order: number }> = {
      'top': { name: 'Principal', icon: '📊', order: 0 },
      'left': { name: 'Combat', icon: '⚔️', order: 1 },
      'center': { name: 'Centre', icon: '📝', order: 2 },
      'right': { name: 'Équipement', icon: '🎒', order: 3 },
      'bottom': { name: 'Notes', icon: '📖', order: 4 }
    };

    // Trouver quelles zones contiennent des éléments
    const usedZones = new Set<string>();
    character.dataItems.forEach(item => {
      if (item.zone) {
        usedZones.add(item.zone);
      }
    });

    // Si aucune zone n'est utilisée, créer un onglet par défaut
    if (usedZones.size === 0) {
      tabs.push({
        id: this.generateId(),
        name: 'Principal',
        icon: '📊',
        order: 0,
        characterId: character.id
      });
    } else {
      // Créer un onglet pour chaque zone utilisée
      usedZones.forEach(zone => {
        const config = zoneMapping[zone] || { name: zone, icon: '📝', order: tabs.length };
        tabs.push({
          id: this.generateId(),
          name: config.name,
          icon: config.icon,
          order: config.order,
          characterId: character.id
        });
      });

      // Trier par ordre
      tabs.sort((a, b) => a.order - b.order);

      // Mettre à jour les dataItems pour utiliser tabId au lieu de zone
      const zoneToTabId: Record<string, string> = {};
      tabs.forEach(tab => {
        const zoneName = Object.keys(zoneMapping).find(
          key => zoneMapping[key].name === tab.name
        );
        if (zoneName) {
          zoneToTabId[zoneName] = tab.id;
        }
      });

      character.dataItems = character.dataItems.map(item => {
        if (item.zone && zoneToTabId[item.zone]) {
          return {
            ...item,
            tabId: zoneToTabId[item.zone],
            column: 0, // Par défaut, première colonne
            zone: undefined // Supprimer l'ancienne propriété
          };
        }
        return item;
      });
    }

    // Assigner les onglets au personnage
    character.dashboardTabs = tabs;
    this.saveCharacter(character);

    return character;
  }
}