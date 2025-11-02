import { Injectable } from '@angular/core';
import { GameSystemDataService, GameSystemData } from './game-system-data.service';
import { DataItem, DataType, PlayerCharacter, GameSystem, SelectListReference, SelectListOption } from '../models/rpg.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class Cof2eService {

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
   * Initialise un personnage Chroniques Oubliées 2e avec les éléments de base
   */
  async initializeCof2eCharacter(character: PlayerCharacter): Promise<void> {
    try {
      const cof2eData = await this.gameSystemDataService.loadGameSystemData(GameSystem.COF2E).toPromise();
      if (!cof2eData) {
        throw new Error('Impossible de charger les données COF2e');
      }

      // Récupérer ou créer les onglets du personnage
      let mainTabId: string;
      let capacitiesTabId: string;
      let fightTabId: string;
      let inventoryTabId: string;
      
      // Créer 4 onglets personnalisés pour COF2e
      const newTabs: any[] = [
        { 
          id: this.storageService.generateId(), 
          name: 'Principal', 
          icon: '📊', 
          order: 0, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 2, 2: 1 } // 3 colonnes: gauche=1x, centre=2x, droite=1x
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Capacités', 
          icon: '🎯', 
          order: 1, 
          characterId: character.id,
          columnWidths: { 0: 4 } // Colonne unique
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Combat', 
          icon: '⚔️', 
          order: 2, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 1 } // 2 colonnes égales
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Inventaire', 
          icon: '🎒', 
          order: 3, 
          characterId: character.id,
          columnWidths: { 0: 2, 1: 1 } // 2 colonnes: gauche=2x, droite=1x
        }
      ];
      
      // Assigner les onglets directement au personnage
      character.dashboardTabs = newTabs;

      // Récupérer les IDs des onglets
      mainTabId = newTabs[0].id;
      capacitiesTabId = newTabs[1].id;
      fightTabId = newTabs[2].id;
      inventoryTabId = newTabs[3].id;

      // Récupérer l'userId du personnage
      const userId = character.userId;

      // Charger les listes de sélection pour Famille, Profils et Peuple (une seule fois)
      // Note: Cette méthode charge elle-même les données COF2e
      await this.loadCof2eSelectLists();

      // Initialiser le tableau dataItems
      character.dataItems = [];
      let order = 0;

      // === ONGLET PRINCIPAL ===

      // Colonne gauche (column: 0)
      // 1. Select Famille
      const familleElement = this.createFamilleSelectElement(cof2eData, userId, mainTabId, 0, order++);
      character.dataItems.push(familleElement);

      // 2. Select Profil (dépendant de la famille)
      const profilElement = this.createProfilSelectElement(cof2eData, userId, mainTabId, 0, order++, familleElement.id);
      character.dataItems.push(profilElement);

      // 3. Select Peuple
      const peupleElement = this.createPeupleSelectElement(cof2eData, userId, mainTabId, 0, order++);
      character.dataItems.push(peupleElement);

      // Colonne centre (column: 1)
      order = 0;

      // 4. Caractéristiques COF2e
      const attributesElement = this.createAttributesElement(userId, mainTabId, 1, order++);
      character.dataItems.push(attributesElement);

      // Colonne centre (column: 2)
      order = 0;

      // 5. Niveau
      const niveauElement = this.createNiveauElement(userId, mainTabId, 2, order++);
      character.dataItems.push(niveauElement);

      // 6. Points de vie
      const pvElement = this.createPointsDeVieElement(userId, mainTabId, 2, order++);
      character.dataItems.push(pvElement);

      // === ONGLET CAPACITÉS ===
      order = 0;

      // 1. Composant Voies (peuple + 2 profil) - Largeur 4
      const voiesElement = this.createVoiesElement(userId, capacitiesTabId, 0, order++);
      character.dataItems.push(voiesElement);

      // Sauvegarder le personnage avec tous les onglets et dataItems
      this.storageService.updateCharacter(character);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation du personnage COF2e:', error);
      throw error;
    }
  }

  /**
   * Charge les listes de sélection COF2e dans le localStorage
   * Méthode publique pour être appelée au démarrage de l'application
   */
  async loadCof2eSelectLists(): Promise<void> {
    try {
      const cof2eData = await this.gameSystemDataService.loadGameSystemData(GameSystem.COF2E).toPromise();
      if (!cof2eData) {
        console.warn('[COF2E] Impossible de charger les données COF2e pour les listes');
        return;
      }

      const now = new Date();
      const lists: SelectListReference[] = [];

      // Liste des Familles
      if (cof2eData.familles && Array.isArray(cof2eData.familles)) {
        const familleOptions: SelectListOption[] = cof2eData.familles.map((famille: any) => ({
          id: this.normalizeNameForId(famille.name),
          label: famille.name,
          value: famille.famille
        }));

        lists.push({
          id: 'cof2e-familles',
          name: 'Familles COF2e',
          type: 'system',
          gameSystem: 'cof2e',
          options: familleOptions,
          createdAt: now,
          updatedAt: now
        });
      }

      // Listes de Profils dynamiques (une par famille)
      const familles = cof2eData.familles || [];
      familles.forEach((famille: any) => {
        if (famille.profils && Array.isArray(famille.profils) && famille.profils.length > 0) {
          const profilOptions: SelectListOption[] = famille.profils.map((profil: any) => ({
            id: this.storageService.generateId(),
            label: profil.name,
            value: profil.name
          }));

          const listId = `cof2e-profils-${this.normalizeNameForId(famille.name)}`;
          lists.push({
            id: listId,
            name: `Profils - ${famille.name}`,
            type: 'system',
            gameSystem: 'cof2e',
            options: profilOptions,
            createdAt: now,
            updatedAt: now
          });
        }
      });

      // Liste des Peuples
      if (cof2eData.peuples && Array.isArray(cof2eData.peuples)) {
        const peupleOptions: SelectListOption[] = cof2eData.peuples.map((peuple: any) => ({
          id: this.normalizeNameForId(peuple.name),
          label: peuple.name,
          value: peuple.peuple
        }));

        lists.push({
          id: 'cof2e-peuples',
          name: 'Peuples COF2e',
          type: 'system',
          gameSystem: 'cof2e',
          options: peupleOptions,
          createdAt: now,
          updatedAt: now
        });
      }

      // Sauvegarder toutes les listes
      lists.forEach(list => {
        this.storageService.saveSelectList(list);
      });

    } catch (error) {
      console.error('[COF2E] Erreur lors du chargement des listes COF2e', error);
    }
  }

  /**
   * Crée les listes de profils dynamiques pour chaque famille
   * @deprecated Utilisez loadCof2eSelectLists() à la place
   */
  private createProfilsDynamicLists(cof2eData: GameSystemData): void {
    const familles = cof2eData.familles || [];
    
    familles.forEach((famille: any) => {
      if (famille.profils && Array.isArray(famille.profils) && famille.profils.length > 0) {
        const profilOptions: SelectListOption[] = famille.profils.map((profil: any) => ({
          id: this.storageService.generateId(),
          label: profil.name,
          value: profil.name
        }));

        const listId = `cof2e-profils-${this.normalizeNameForId(famille.name)}`;
        const list: SelectListReference = {
          id: listId,
          name: `Profils - ${famille.name}`,
          type: 'system',
          gameSystem: 'cof2e',
          options: profilOptions,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.storageService.saveSelectList(list);
      }
    });
  }

  /**
   * Crée l'élément de sélection de la famille
   */
  private createFamilleSelectElement(cof2eData: GameSystemData, userId: string, tabId: string, column: number, order: number): DataItem {
    // La liste est déjà créée par loadCof2eSelectLists()
    const listId = 'cof2e-familles';

    return {
      id: this.storageService.generateId(),
      userId,
      name: 'Famille',
      description: 'Famille du personnage (Aventurier, Érudit, Maître d\'armes...)',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: column,
      order: order,
      metadata: {
        selectListId: listId,
        cof2eType: 'famille'
      }
    };
  }

  /**
   * Crée l'élément de sélection du profil
   */
  private createProfilSelectElement(cof2eData: GameSystemData, userId: string, tabId: string, column: number, order: number, familleElementId: string): DataItem {
    // La liste sera définie dynamiquement selon la famille choisie
    // Les listes cof2e-profils-{famille} ont été créées par createProfilsDynamicLists()
    return {
      id: this.storageService.generateId(),
      userId,
      name: 'Profil',
      description: 'Profil du personnage (dépend de la famille)',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: column,
      order: order,
      metadata: {
        selectListId: '', // Sera défini dynamiquement selon la famille choisie
        cof2eType: 'profil',
        dependsOn: familleElementId // ID de l'élément Famille
      }
    };
  }

  /**
   * Crée l'élément de sélection du peuple
   */
  private createPeupleSelectElement(cof2eData: GameSystemData, userId: string, tabId: string, column: number, order: number): DataItem {
    // La liste est déjà créée par loadCof2eSelectLists()
    const listId = 'cof2e-peuples';

    return {
      id: this.storageService.generateId(),
      userId,
      name: 'Peuple',
      description: 'Peuple du personnage (Elfe, Nain, Humain...)',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: column,
      order: order,
      metadata: {
        selectListId: listId,
        cof2eType: 'peuple'
      }
    };
  }

  /**
   * Crée l'élément Niveau
   */
  private createNiveauElement(userId: string, tabId: string, column: number, order: number): DataItem {
    return {
      id: this.storageService.generateId(),
      userId,
      name: 'Niveau',
      description: 'Niveau du personnage',
      type: DataType.NUMERIC,
      value: 1,
      tabId: tabId,
      column: column,
      order: order,
      allowQuickModification: true
    };
  }

  /**
   * Crée l'élément Points de vie
   */
  private createPointsDeVieElement(userId: string, tabId: string, column: number, order: number): DataItem {
    return {
      id: this.storageService.generateId(),
      userId,
      name: 'Points de vie',
      description: 'Points de vie actuels / maximums',
      type: DataType.HP,
      value: 0,
      tabId: tabId,
      column: column,
      order: order,
      metadata: {
        currentHp: 0,
        maxHp: 0,
        tempHp: 0
      }
    };
  }

  /**
   * Crée l'élément Voies (composant spécifique COF2e)
   */
  private createVoiesElement(userId: string, tabId: string, column: number, order: number): DataItem {
    return {
      id: this.storageService.generateId(),
      userId,
      name: 'Voies et Capacités',
      description: 'Voies du peuple et du profil avec leurs capacités',
      type: DataType.COF2E_VOIES,
      value: '',
      tabId: tabId,
      column: column,
      order: order,
      metadata: {
        voies: [], // Tableau des voies sélectionnées avec leurs capacités
        capacitesAcquises: [] // Rang de capacités acquises par niveau
      }
    };
  }

  /**
   * Crée l'élément des Caractéristiques COF2e
   */
  private createAttributesElement(userId: string, tabId: string, column: number, order: number): DataItem {
    return {
      id: this.storageService.generateId(),
      userId,
      name: 'Caractéristiques',
      description: 'Les 7 caractéristiques du personnage (FOR, AGI, CON, PER, INT, CHA, VOL)',
      type: DataType.COF2E_ATTRIBUTES_GROUP,
      value: '',
      tabId: tabId,
      column: column,
      order: order,
      metadata: {
        attributes: {
          FOR: 0,
          AGI: 0,
          CON: 0,
          PER: 0,
          INT: 0,
          CHA: 0,
          VOL: 0
        }
      }
    };
  }
}
