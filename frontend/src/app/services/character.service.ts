import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PlayerCharacter, GameSystem, GAME_SYSTEM_LABELS } from '../models/rpg.models';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { Dnd5eService } from './dnd5e.service';
import { Dnd4eService } from './dnd4e.service';
import { GameSystemDataService } from './game-system-data.service';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  constructor(
    private storageService: StorageService,
    private userService: UserService,
    private dnd5eService: Dnd5eService,
    private dnd4eService: Dnd4eService,
    private gameSystemDataService: GameSystemDataService
  ) {}

  // Obtenir le personnage actuel
  getCurrentCharacter(): PlayerCharacter | null {
    return this.storageService.getCurrentCharacter();
  }

  // Observable du personnage actuel
  get currentCharacter$(): Observable<PlayerCharacter | null> {
    return this.storageService.currentCharacter$;
  }

  // Obtenir tous les personnages de l'utilisateur actuel
  getUserCharacters(): PlayerCharacter[] {
    const user = this.userService.getCurrentUser();
    if (user) {
      return this.storageService.getCharacters(user.id);
    }
    return [];
  }

  // Changer de personnage actuel
  setCurrentCharacter(character: PlayerCharacter): void {
    this.storageService.setCurrentCharacter(character);
  }

  // Supprimer le personnage actuel
  clearCurrentCharacter(): void {
    this.storageService.clearCurrentCharacter();
  }

  // Créer un nouveau personnage
  async createCharacter(name: string, gameSystem: GameSystem): Promise<PlayerCharacter> {
  // createCharacter called
    const user = this.userService.getCurrentUser();
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }

    const newCharacter = this.storageService.createNewCharacter(name, gameSystem, user.id);

    // Initialiser avec les données spécifiques au système de jeu si disponibles
    if (this.gameSystemDataService.hasGameSystemData(gameSystem)) {
      if (gameSystem === GameSystem.DND5E) {
        await this.dnd5eService.initializeDnd5eCharacter(newCharacter);
      } else if (gameSystem === GameSystem.DND4E) {
        await this.dnd4eService.initializeDnd4eCharacter(newCharacter);
      }
    }

    return newCharacter;
  }

  // Mettre à jour un personnage
  updateCharacter(character: PlayerCharacter): void {
    this.storageService.updateCharacter(character);
  }

  // Supprimer un personnage
  deleteCharacter(characterId: string): void {
    const characters = this.getUserCharacters();
    const characterToDelete = characters.find(c => c.id === characterId);
    
    if (characterToDelete) {
      this.storageService.deleteCharacter(characterId);
      
      // Si c'était le personnage actuel, choisir un autre
      const currentCharacter = this.getCurrentCharacter();
      if (currentCharacter && currentCharacter.id === characterId) {
        const remainingCharacters = this.getUserCharacters();
        if (remainingCharacters.length > 0) {
          this.setCurrentCharacter(remainingCharacters[0]);
        } else {
          this.storageService.clearCurrentCharacter();
        }
      }
    }
  }

  // Obtenir le label d'un système de jeu
  getGameSystemLabel(gameSystem: GameSystem): string {
    return GAME_SYSTEM_LABELS[gameSystem];
  }

  // Obtenir tous les systèmes de jeu disponibles
  getAvailableGameSystems(): Array<{value: GameSystem, label: string}> {
    return Object.entries(GAME_SYSTEM_LABELS).map(([value, label]) => ({
      value: value as GameSystem,
      label
    }));
  }

  // Vérifier si un personnage existe
  characterExists(characterId: string): boolean {
    const characters = this.getUserCharacters();
    return characters.some(c => c.id === characterId);
  }

  // Dupliquer un personnage
  duplicateCharacter(character: PlayerCharacter): PlayerCharacter {
    const user = this.userService.getCurrentUser();
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }

    const duplicatedCharacter: PlayerCharacter = {
      ...character,
      id: this.storageService.generateId(),
      name: `${character.name} (copie)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Dupliquer les données également
      dataItems: character.dataItems.map(item => ({
        ...item,
        id: this.storageService.generateId()
      })),
      dataGroups: character.dataGroups.map(group => ({
        ...group,
        id: this.storageService.generateId()
      }))
    };

    this.storageService.saveCharacter(duplicatedCharacter);
    return duplicatedCharacter;
  }
}