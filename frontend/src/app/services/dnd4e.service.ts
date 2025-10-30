import { Injectable } from '@angular/core';
import { GameSystemDataService, GameSystemData } from './game-system-data.service';
import { DataItem, DataType, PlayerCharacter, GameSystem, SelectListReference, SelectListOption } from '../models/rpg.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class Dnd4eService {

  constructor(
    private gameSystemDataService: GameSystemDataService,
    private storageService: StorageService
  ) {}

  /**
   * Normalise un nom pour créer un identifiant (enlève accents, espaces, etc.)
   */
  private normalizeNameForId(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Décomposer les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/[^a-z0-9-]/g, ''); // Supprimer autres caractères spéciaux
  }

  /**
   * Initialise un personnage D&D 4e avec les éléments de base
   */
  async initializeDnd4eCharacter(character: PlayerCharacter): Promise<void> {
    try {
      const dnd4eData = await this.gameSystemDataService.loadGameSystemData(GameSystem.DND4E).toPromise();
      if (!dnd4eData) {
        throw new Error('Impossible de charger les données D&D 4e');
      }

      // Récupérer ou créer les onglets du personnage (même structure que D&D 5e)
      let mainTabId: string;
      let skillsTabId: string;
      let capacitiesTabId: string;
      let fightTabId: string;
      let spellsTabId: string;
      let inventoryTabId: string;
      
      // Le personnage est créé avec 1 onglet par défaut, on le remplace par 6 onglets personnalisés
      const newTabs: any[] = [
        { 
          id: this.storageService.generateId(), 
          name: 'Principal', 
          icon: '📊', 
          order: 0, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 2, 2: 2, 3: 1 } // Colonnes: gauche=1x, centre=2x, droite=2x, extra=1x
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Compétences', 
          icon: '🛠️', 
          order: 1, 
          characterId: character.id,
          columnWidths: { 0: 3 } // Colonne unique large (3x)
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Capacités', 
          icon: '🎯', 
          order: 2, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 1, 2: 1 } // 3 colonnes: gauche=1x, centre=1x, droite=1x
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Combat', 
          icon: '⚔️', 
          order: 3, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 1, 2: 1 } // 3 colonnes égales
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Sorts', 
          icon: '🪄', 
          order: 4, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 2 } // 2 colonnes: gauche=1x, droite=2x
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Inventaire', 
          icon: '🎒', 
          order: 5, 
          characterId: character.id,
          columnWidths: { 0: 2, 1: 1 } // 2 colonnes: gauche=2x, droite=1x
        }
      ];
      
      // Assigner les onglets directement au personnage avant de le sauvegarder
      character.dashboardTabs = newTabs;

      // Récupérer les IDs des onglets
      mainTabId = newTabs[0].id;
      skillsTabId = newTabs[1].id;
      capacitiesTabId = newTabs[2].id;
      fightTabId = newTabs[3].id;
      spellsTabId = newTabs[4].id;
      inventoryTabId = newTabs[5].id;

      // Charger les listes de sélection pour Race et Classe
      await this.loadDnd4eSelectLists(dnd4eData, character.userId);

      const userId = character.userId;
      const characterElements: DataItem[] = [];

      // === ONGLET PRINCIPAL ===
      
      // Race (1ère colonne)
      const raceElement = this.createRaceElement(userId, mainTabId);
      characterElements.push(raceElement);

      // Classe (1ère colonne, après Race)
      const classElement = this.createClassElement(userId, mainTabId);
      characterElements.push(classElement);

      // Groupe d'attributs (2ème colonne)
      const attributesGroup = this.createAttributesGroupElement(userId, mainTabId);
      characterElements.push(attributesGroup);

      // === ONGLET COMBAT ===
      
      // Points de vie (1ère colonne)
      const hpElement = this.createHitPointsElement(userId, fightTabId);
      characterElements.push(hpElement);

      // Ajouter tous les éléments au personnage
      if (!character.dataItems) {
        character.dataItems = [];
      }
      
      for (const element of characterElements) {
        character.dataItems.push(element);
      }

      // Sauvegarder le personnage avec les nouveaux onglets et éléments
      this.storageService.updateCharacter(character);

      console.log('Initialisation D&D 4e terminée', { character, elements: characterElements });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du personnage D&D 4e:', error);
      throw error;
    }
  }

  /**
   * Charge les listes de sélection D&D 4e dans le localStorage
   */
  private async loadDnd4eSelectLists(dnd4eData: GameSystemData, userId: string): Promise<void> {
    const now = new Date();
    const lists: any[] = [];

    // Charger la liste des races
    if (dnd4eData.races && Array.isArray(dnd4eData.races)) {
      const raceOptions: SelectListOption[] = dnd4eData.races.map((race: any) => ({
        id: this.storageService.generateId(),
        label: race.name,
        value: race.name
      }));

      lists.push({
        id: 'dnd4e-races',
        name: 'Races D&D 4e',
        type: 'system',
        gameSystem: GameSystem.DND4E,
        options: raceOptions,
        createdAt: now,
        updatedAt: now
      });
    }

    // Charger la liste des classes
    if (dnd4eData.classes && Array.isArray(dnd4eData.classes)) {
      const classOptions: SelectListOption[] = dnd4eData.classes.map((classe: any) => ({
        id: this.storageService.generateId(),
        label: classe.name,
        value: classe.name
      }));

      lists.push({
        id: 'dnd4e-classes',
        name: 'Classes D&D 4e',
        type: 'system',
        gameSystem: GameSystem.DND4E,
        options: classOptions,
        createdAt: now,
        updatedAt: now
      });
    }

    // Sauvegarder toutes les listes
    lists.forEach(list => {
      this.storageService.saveSelectList(list);
    });
  }

  /**
   * Crée l'élément Race
   */
  private createRaceElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Race',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 0, // 1ère colonne
      order: 0,
      userId,
      description: 'Choisissez la race de votre personnage',
      allowQuickModification: true,
      metadata: {
        dnd4eType: 'race',
        selectListId: 'dnd4e-races'
      }
    };
  }

  /**
   * Crée l'élément Classe
   */
  private createClassElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Classe',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 0, // 1ère colonne
      order: 1, // Après Race
      userId,
      description: 'Choisissez la classe de votre personnage',
      allowQuickModification: true,
      metadata: {
        dnd4eType: 'class',
        selectListId: 'dnd4e-classes'
      }
    };
  }

  /**
   * Crée l'élément Points de vie
   */
  private createHitPointsElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Points de vie',
      type: DataType.HP,
      value: 0,
      tabId: tabId,
      column: 0, // 1ère colonne
      order: 0,
      userId,
      description: 'Points de vie actuels et maximum',
      allowQuickModification: true,
      metadata: {
        dnd4eType: 'hit-points',
        maxHp: 0,
        currentHp: 0,
        temporaryHp: 0
      }
    };
  }

  /**
   * Crée le groupe d'attributs D&D 4e
   */
  private createAttributesGroupElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Attributs',
      type: DataType.DND4E_ATTRIBUTES_GROUP,
      value: 'Attributs', // Nom d'affichage
      tabId: tabId,
      column: 1, // 2ème colonne
      order: 0,
      userId,
      description: 'Les 6 attributs de base et les bonus aux défenses',
      allowQuickModification: false,
      metadata: {
        dnd4eType: 'attributes-group',
        attributes: {
          FOR: 10,
          DEX: 10,
          CON: 10,
          INT: 10,
          SAG: 10,
          CHA: 10
        }
      }
    };
  }
}
