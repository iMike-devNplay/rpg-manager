import { Injectable } from '@angular/core';
import { Adventure, AdventureCharacterReference, GameSystem, JournalEntry } from '../models/rpg.models';
import { StorageService } from './storage.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AdventureService {
  private readonly ADVENTURES_KEY = 'rpg-manager-adventures';

  constructor(
    private storageService: StorageService,
    private userService: UserService
  ) {}

  /**
   * Récupère toutes les aventures de l'utilisateur actuel
   */
  getAdventures(): Adventure[] {
    const user = this.userService.getCurrentUser();
    if (!user) return [];

    const data = localStorage.getItem(this.ADVENTURES_KEY);
    if (!data) return [];

    try {
      const adventures = JSON.parse(data) as Adventure[];
      // Reconvertir les dates
      return adventures
        .filter(adv => adv.gameMasterId === user.id)
        .map(adv => this.convertAdventureDates(adv));
    } catch (error) {
      console.error('Erreur lors du chargement des aventures:', error);
      return [];
    }
  }

  /**
   * Récupère une aventure par son ID
   */
  getAdventureById(id: string): Adventure | null {
    const adventures = this.getAdventures();
    return adventures.find(adv => adv.id === id) || null;
  }

  /**
   * Convertit les dates d'une aventure depuis le format JSON
   */
  private convertAdventureDates(adv: Adventure): Adventure {
    return {
      ...adv,
      date: new Date(adv.date),
      createdAt: new Date(adv.createdAt),
      updatedAt: new Date(adv.updatedAt),
      journalEntries: adv.journalEntries?.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      })) || []
    };
  }

  /**
   * Crée une nouvelle aventure
   */
  createAdventure(adventureData: Omit<Adventure, 'id' | 'gameMasterId' | 'journal' | 'journalEntries' | 'createdAt' | 'updatedAt'>): Adventure {
    const user = this.userService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const newAdventure: Adventure = {
      ...adventureData,
      id: this.storageService.generateId(),
      gameMasterId: user.id,
      journal: '',
      journalEntries: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const adventures = this.getAllAdventures();
    adventures.push(newAdventure);
    this.saveAdventures(adventures);

    return newAdventure;
  }

  /**
   * Met à jour une aventure existante
   */
  updateAdventure(id: string, updates: Partial<Omit<Adventure, 'id' | 'gameMasterId' | 'createdAt'>>): Adventure | null {
    const adventures = this.getAllAdventures();
    const index = adventures.findIndex(adv => adv.id === id);

    if (index === -1) {
      return null;
    }

    const user = this.userService.getCurrentUser();
    if (!user || adventures[index].gameMasterId !== user.id) {
      throw new Error('Non autorisé à modifier cette aventure');
    }

    adventures[index] = {
      ...adventures[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveAdventures(adventures);
    return adventures[index];
  }

  /**
   * Supprime une aventure
   */
  deleteAdventure(id: string): boolean {
    const user = this.userService.getCurrentUser();
    if (!user) return false;

    const adventures = this.getAllAdventures();
    const index = adventures.findIndex(adv => adv.id === id);

    if (index === -1) return false;

    if (adventures[index].gameMasterId !== user.id) {
      throw new Error('Non autorisé à supprimer cette aventure');
    }

    adventures.splice(index, 1);
    this.saveAdventures(adventures);
    return true;
  }

  /**
   * Ajoute un personnage à une aventure
   */
  addCharacterToAdventure(adventureId: string, characterId: string, userId: string): boolean {
    const adventure = this.getAdventureById(adventureId);
    if (!adventure) return false;

    // Vérifier si le personnage n'est pas déjà dans l'aventure
    const exists = adventure.characters.some(char => char.characterId === characterId);
    if (exists) return false;

    adventure.characters.push({ characterId, userId });
    this.updateAdventure(adventureId, { characters: adventure.characters });
    return true;
  }

  /**
   * Retire un personnage d'une aventure
   */
  removeCharacterFromAdventure(adventureId: string, characterId: string): boolean {
    const adventure = this.getAdventureById(adventureId);
    if (!adventure) return false;

    adventure.characters = adventure.characters.filter(char => char.characterId !== characterId);
    this.updateAdventure(adventureId, { characters: adventure.characters });
    return true;
  }

  /**
   * Met à jour le journal d'une aventure
   */
  updateJournal(adventureId: string, journal: string): boolean {
    const result = this.updateAdventure(adventureId, { journal });
    return result !== null;
  }

  /**
   * Ajoute une entrée au journal d'une aventure
   */
  addJournalEntry(adventureId: string, content: string): JournalEntry | null {
    const adventure = this.getAdventureById(adventureId);
    if (!adventure) return null;

    const newEntry: JournalEntry = {
      id: this.storageService.generateId(),
      content: content.trim(),
      timestamp: new Date()
    };

    // Initialiser le tableau si nécessaire
    if (!adventure.journalEntries) {
      adventure.journalEntries = [];
    }

    adventure.journalEntries.push(newEntry);
    this.updateAdventure(adventureId, { journalEntries: adventure.journalEntries });
    
    return newEntry;
  }

  /**
   * Supprime une entrée du journal
   */
  deleteJournalEntry(adventureId: string, entryId: string): boolean {
    const adventure = this.getAdventureById(adventureId);
    if (!adventure || !adventure.journalEntries) return false;

    adventure.journalEntries = adventure.journalEntries.filter(entry => entry.id !== entryId);
    this.updateAdventure(adventureId, { journalEntries: adventure.journalEntries });
    return true;
  }

  /**
   * Récupère toutes les aventures (tous utilisateurs)
   * Méthode privée pour les opérations internes
   */
  private getAllAdventures(): Adventure[] {
    const data = localStorage.getItem(this.ADVENTURES_KEY);
    if (!data) return [];

    try {
      const adventures = JSON.parse(data) as Adventure[];
      return adventures.map(adv => this.convertAdventureDates(adv));
    } catch (error) {
      console.error('Erreur lors du chargement de toutes les aventures:', error);
      return [];
    }
  }

  /**
   * Sauvegarde toutes les aventures
   */
  private saveAdventures(adventures: Adventure[]): void {
    localStorage.setItem(this.ADVENTURES_KEY, JSON.stringify(adventures));
  }
}
