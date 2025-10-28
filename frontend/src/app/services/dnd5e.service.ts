import { Injectable } from '@angular/core';
import { GameSystemDataService, GameSystemData } from './game-system-data.service';
import { DataItem, DataType, DashboardZone, PlayerCharacter, GameSystem, SelectListReference, SelectListOption } from '../models/rpg.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class Dnd5eService {

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
   * Initialise un personnage D&D 5e avec les éléments de base
   */
  async initializeDnd5eCharacter(character: PlayerCharacter): Promise<void> {
  // Initialisation D&D 5e démarrée
    try {
      const dnd5eData = await this.gameSystemDataService.loadGameSystemData(GameSystem.DND5E).toPromise();
      if (!dnd5eData) {
        throw new Error('Impossible de charger les données D&D 5e');
      }

      // Récupérer ou créer les onglets du personnage
      let mainTabId: string;
      let skillsTabId: string;
      let fightTabId: string;
      let spellsTabId: string;
      let inventoryTabId: string;
      
      // Le personnage est créé avec 1 onglet par défaut, on le remplace par 5 onglets personnalisés
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
          name: 'Combat', 
          icon: '⚔️', 
          order: 2, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 1, 2: 1 } // 3 colonnes égales
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Sorts', 
          icon: '🪄', 
          order: 3, 
          characterId: character.id,
          columnWidths: { 0: 1, 1: 2 } // 2 colonnes: gauche=1x, droite=2x
        },
        { 
          id: this.storageService.generateId(), 
          name: 'Inventaire', 
          icon: '🎒', 
          order: 4, 
          characterId: character.id,
          columnWidths: { 0: 2, 1: 1 } // 2 colonnes: gauche=2x, droite=1x
        }
      ];
      
      // Assigner les onglets directement au personnage avant de le sauvegarder
      character.dashboardTabs = newTabs;
      
      // Assigner les IDs
      mainTabId = newTabs[0].id;
      skillsTabId = newTabs[1].id;
      fightTabId = newTabs[2].id;
      spellsTabId = newTabs[3].id;
      inventoryTabId = newTabs[4].id;


      const elementsToCreate: DataItem[] = [];

      // 4a - Création du nouveau bonus de maîtrise D&D
  // Création du bonus de maîtrise D&D
      elementsToCreate.push(this.createDndProficiencyBonus(character.userId, mainTabId));

      // 4a-bis - Création du niveau D&D
  // Création du niveau D&D
      elementsToCreate.push(this.createDndLevel(character.userId, mainTabId));

      // 4a-ter - Création du groupe d'attributs
  // Création du groupe d'attributs
      elementsToCreate.push(this.createAttributesGroup(character.userId, mainTabId));

      // 4a-qua - Création du groupe de compétences
  // Création du groupe de compétences
      elementsToCreate.push(this.createSkillsGroup(character.userId, skillsTabId));

      // 4b - Anciens attributs individuels désactivés - remplacés par le groupe d'attributs
      /*
      if (dnd5eData.attributes) {
        dnd5eData.attributes.forEach((attr: any) => {
          elementsToCreate.push(this.createAttribute(attr, character.userId));
        });
      }
      */

      // 4d - Création de l'élément Origine
      let origineElement: DataItem | null = null;
      if (dnd5eData.origines) {
        origineElement = this.createOriginElement(dnd5eData.origines, character.userId, mainTabId);
        elementsToCreate.push(origineElement);
      }

      // 4e - Création de l'élément Classe
      if (dnd5eData.classes) {
        elementsToCreate.push(this.createClassElement(dnd5eData.classes, character.userId, mainTabId));
      }

      // Création des éléments texte et select (Peuple dépend de l'Origine)
      elementsToCreate.push(this.createPeopleElement(character.userId, mainTabId, origineElement?.id));

      // Création de l'élément Historique (devient SELECT)
      const backgroundElement = this.createBackgroundElement(character.userId, mainTabId);
      elementsToCreate.push(backgroundElement);

      // Création des éléments dépendants de l'Historique (Trait, Idéal, Lien, Défaut)
      elementsToCreate.push(this.createPersonalityTraitElement(character.userId, mainTabId, backgroundElement.id));
      elementsToCreate.push(this.createIdealElement(character.userId, mainTabId, backgroundElement.id));
      elementsToCreate.push(this.createBondElement(character.userId, mainTabId, backgroundElement.id));
      elementsToCreate.push(this.createFlawElement(character.userId, mainTabId, backgroundElement.id));
      elementsToCreate.push(this.createLanguageElement(character.userId, mainTabId));
      elementsToCreate.push(this.createToolsElement(character.userId, mainTabId));
      elementsToCreate.push(this.createProficienciesElement(character.userId, mainTabId));
      elementsToCreate.push(this.createSpeedElement(character.userId, mainTabId));

      // Création des éléments numériques
      elementsToCreate.push(this.createInitiativeElement(character.userId, fightTabId));
      elementsToCreate.push(this.createArmorClassElement(character.userId, fightTabId));
      elementsToCreate.push(this.createPassivePerceptionElement(character.userId, mainTabId));

      // Création de l'élément points de vie
      elementsToCreate.push(this.createHitPointsElement(character.userId, fightTabId));

  // Nombre d'éléments à créer: elementsToCreate.length

      // Sauvegarder tous les éléments directement sur le personnage
      for (const element of elementsToCreate) {
        // Ajouter directement à la liste des dataItems du personnage
        if (!character.dataItems) {
          character.dataItems = [];
        }
        character.dataItems.push(element);
      }

      // Mettre à jour le personnage dans le storage
      this.storageService.updateCharacter(character);

  // Initialisation D&D 5e terminée
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du personnage D&D 5e:', error);
      throw error;
    }
  }

  /**
   * Crée l'élément bonus de maîtrise D&D spécialisé
   */
  private createDndProficiencyBonus(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Bonus de maîtrise',
      type: DataType.DND_PROFICIENCY_BONUS,
      value: 2, // Valeur par défaut
      tabId: tabId,
      column: 0,
      order: 0,
      userId,
      description: 'Bonus de maîtrise du personnage (augmente avec le niveau)',
      metadata: {
        dnd5eType: 'dnd-proficiency-bonus',
        level: 1
      }
    };
  }

  /**
   * Crée l'élément niveau D&D spécialisé
   */
  private createDndLevel(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Niveau',
      type: DataType.DND_LEVEL,
      value: 1, // Niveau par défaut
      tabId: tabId,
      column: 0,
      order: 1,
      userId,
      description: 'Niveau du personnage (1-20)',
      metadata: {
        dnd5eType: 'dnd-level'
      }
    };
  }

  /**
   * Crée le groupe de compétences D&D 5e
   */
  private createSkillsGroup(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Compétences',
      type: DataType.DND_SKILLS_GROUP,
      value: 'Compétences', // Nom d'affichage
      tabId: tabId,
      column: 0,
      order: 0,
      userId,
      description: 'Toutes les compétences D&D 5e avec maîtrise et expertise',
      metadata: {
        dnd5eType: 'dnd-skills-group',
        skills: {
          // Compétences basées sur la Force
          athletics: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur la Dextérité
          acrobatics: { hasProficiency: false, hasExpertise: false },
          sleightOfHand: { hasProficiency: false, hasExpertise: false },
          stealth: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur l'Intelligence
          arcana: { hasProficiency: false, hasExpertise: false },
          history: { hasProficiency: false, hasExpertise: false },
          investigation: { hasProficiency: false, hasExpertise: false },
          nature: { hasProficiency: false, hasExpertise: false },
          religion: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur la Sagesse
          animalHandling: { hasProficiency: false, hasExpertise: false },
          insight: { hasProficiency: false, hasExpertise: false },
          medicine: { hasProficiency: false, hasExpertise: false },
          perception: { hasProficiency: false, hasExpertise: false },
          survival: { hasProficiency: false, hasExpertise: false },
          // Compétences basées sur le Charisme
          deception: { hasProficiency: false, hasExpertise: false },
          intimidation: { hasProficiency: false, hasExpertise: false },
          performance: { hasProficiency: false, hasExpertise: false },
          persuasion: { hasProficiency: false, hasExpertise: false }
        }
      }
    };
  }

  /**
   * Crée le groupe d'attributs D&D 5e
   */
  private createAttributesGroup(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Attributs',
      type: DataType.ATTRIBUTES_GROUP,
      value: 'Attributs', // Nom d'affichage
      tabId: tabId,
      column: 1,
      order: 0,
      userId,
      description: 'Groupe des 6 attributs principaux avec modificateurs et jets de sauvegarde',
      metadata: {
        dnd5eType: 'attributes-group',
        attributes: {
          strength: { value: 10, hasProficiency: false },
          dexterity: { value: 10, hasProficiency: false },
          constitution: { value: 10, hasProficiency: false },
          intelligence: { value: 10, hasProficiency: false },
          wisdom: { value: 10, hasProficiency: false },
          charisma: { value: 10, hasProficiency: false }
        }
      }
    };
  }

  /**
   * Crée l'élément Origine
   */
  private createOriginElement(origines: any[], userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Origine',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 0,
      order: 2,
      userId,
      description: 'Origine/Race du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'origin',
        selectListId: 'dnd5e-origines'
      }
    };
  }

  /**
   * Crée l'élément Classe
   */
  private createClassElement(classes: any[], userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Classe',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 0,
      order: 4,
      userId,
      description: 'Classe du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'class',
        selectListId: 'dnd5e-classes'
      }
    };
  }

  /**
   * Crée l'élément texte Peuple
   */
  /**
   * Crée l'élément Peuple (SELECT dépendant de l'Origine)
   */
  private createPeopleElement(userId: string, tabId: string, origineElementId?: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Peuple',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 0,
      order: 3,
      userId,
      description: 'Peuple du personnage (dépend de l\'origine)',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'people',
        selectListId: '', // Sera défini dynamiquement selon l'origine choisie
        dependsOn: origineElementId || '' // ID de l'élément Origine
      }
    };
  }

  /**
   * Crée l'élément texte Historique
   */
  /**
   * Crée l'élément select Historique
   */
  private createBackgroundElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Historique',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 2,
      order: 0,
      userId,
      description: 'Historique du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'background',
        selectListId: 'dnd5e-historiques'
      }
    };
  }

  /**
   * Crée l'élément select Trait de personnalité (dépend de l'historique)
   */
  private createPersonalityTraitElement(userId: string, tabId: string, backgroundElementId?: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Trait de personnalité',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 2,
      order: 1,
      userId,
      description: 'Traits de personnalité du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'personality-trait',
        selectListId: '',
        dependsOn: backgroundElementId
      }
    };
  }

  /**
   * Crée l'élément numérique Initiative
   */
  private createInitiativeElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Initiative',
      type: DataType.NUMERIC,
      value: 0,
      tabId: tabId,
      column: 2,
      order: 0,
      userId,
      description: 'Bonus d\'initiative (généralement modificateur de Dextérité)',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'initiative'
      }
    };
  }

  /**
   * Crée l'élément numérique Classe d'armure
   */
  private createArmorClassElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Classe d\'armure',
      type: DataType.NUMERIC,
      value: 10,
      tabId: tabId,
      column: 2,
      order: 1,
      userId,
      description: 'Classe d\'armure (CA) du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'armor-class'
      }
    };
  }

  /**
   * Crée l'élément select Idéal (dépend de l'historique)
   */
  private createIdealElement(userId: string, tabId: string, backgroundElementId?: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Idéal',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 2,
      order: 2,
      userId,
      description: 'Idéal du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'ideal',
        selectListId: '',
        dependsOn: backgroundElementId
      }
    };
  }

  /**
   * Crée l'élément select Lien (dépend de l'historique)
   */
  private createBondElement(userId: string, tabId: string, backgroundElementId?: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Lien',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 2,
      order: 3,
      userId,
      description: 'Lien du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'bond',
        selectListId: '',
        dependsOn: backgroundElementId
      }
    };
  }

  /**
   * Crée l'élément select Défaut (dépend de l'historique)
   */
  private createFlawElement(userId: string, tabId: string, backgroundElementId?: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Défaut',
      type: DataType.SELECT,
      value: '',
      tabId: tabId,
      column: 2,
      order: 4,
      userId,
      description: 'Défaut du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'flaw',
        selectListId: '',
        dependsOn: backgroundElementId
      }
    };
  }

  /**
   * Crée l'élément texte Langue
   */
  private createLanguageElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Langue',
      type: DataType.TEXT,
      value: '',
      tabId: tabId,
      column: 1,
      order: 1,
      userId,
      description: 'Langues parlées par le personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'language'
      }
    };
  }

  /**
   * Crée l'élément texte Outils
   */
  private createToolsElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Outils',
      type: DataType.TEXT,
      value: '',
      tabId: tabId,
      column: 1,
      order: 2,
      userId,
      description: 'Outils maîtrisés par le personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'tools'
      }
    };
  }

  /**
   * Crée l'élément texte Maîtrises
   */
  private createProficienciesElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Maîtrises',
      type: DataType.TEXT,
      value: '',
      tabId: tabId,
      column: 1,
      order: 3,
      userId,
      description: 'Autres maîtrises du personnage (armes, armures, etc.)',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'proficiencies'
      }
    };
  }

  /**
   * Crée l'élément texte Vitesse
   */
  private createSpeedElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Vitesse',
      type: DataType.TEXT,
      value: '9 m',
      tabId: tabId,
      column: 3,
      order: 0,
      userId,
      description: 'Vitesse de déplacement du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'speed'
      }
    };
  }

  /**
   * Crée l'élément numérique Perception passive
   */
  private createPassivePerceptionElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Perception passive',
      type: DataType.NUMERIC,
      value: 10,
      tabId: tabId,
      column: 3,
      order: 1,
      userId,
      description: 'Perception passive (10 + modificateur de Sagesse + bonus de maîtrise si maîtrise de Perception)',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'passive-perception'
      }
    };
  }

  /**
   * Crée l'élément points de vie
   */
  private createHitPointsElement(userId: string, tabId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Points de vie',
      type: DataType.HP,
      value: 0,
      tabId: tabId,
      column: 0,
      order: 0,
      userId,
      description: 'Points de vie actuels et maximum',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'hit-points',
        maxHp: 0,
        currentHp: 0,
        temporaryHp: 0
      }
    };
  }

  /**
   * Calcule le modificateur d'un attribut
   */
  calculateAttributeModifier(attributeValue: number): number {
    return Math.floor((attributeValue - 10) / 2);
  }

  /**
   * Calcule la valeur d'un jet de sauvegarde
   */
  calculateSavingThrow(attributeValue: number, hasProficiency: boolean, proficiencyBonus: number): number {
    const modifier = this.calculateAttributeModifier(attributeValue);
    return modifier + (hasProficiency ? proficiencyBonus : 0);
  }

  /**
   * Calcule la valeur d'une compétence
   * 4f-5 - égal au modificateur de l'attribut lié + bonus de maîtrise si maîtrisée
   */
  calculateSkillValue(attributeValue: number, hasProficiency: boolean, hasExpertise: boolean, proficiencyBonus: number): number {
    const modifier = this.calculateAttributeModifier(attributeValue);
    let bonus = 0;
    
    if (hasExpertise) {
      bonus = proficiencyBonus * 2; // Expertise = double maîtrise
    } else if (hasProficiency) {
      bonus = proficiencyBonus;
    }
    
    return modifier + bonus;
  }

  /**
   * Met à jour les valeurs calculées d'un personnage D&D 5e
   */
  updateCalculatedValues(character: PlayerCharacter): void {
    // Chercher d'abord le nouveau bonus de maîtrise D&D, puis l'ancien en fallback
    let proficiencyBonusItem = character.dataItems.find(item => 
      item.metadata?.dnd5eType === 'dnd-proficiency-bonus'
    );
    
    if (!proficiencyBonusItem) {
      proficiencyBonusItem = character.dataItems.find(item => 
        item.metadata?.dnd5eType === 'proficiency-bonus'
      );
    }
    
    const proficiencyBonus = proficiencyBonusItem ? Number(proficiencyBonusItem.value) : 2;

    // Note: Les compétences sont maintenant gérées par le DndSkillsGroupElement
    // et ne nécessitent plus de mise à jour individuelle
  }

  /**
   * Calcule le bonus de maîtrise basé sur le niveau D&D 5e
   * @param level Niveau du personnage (1-20)
   * @returns Bonus de maîtrise correspondant
   */
  calculateProficiencyBonusFromLevel(level: number): number {
    if (level <= 0) return 2;
    if (level <= 4) return 2;
    if (level <= 8) return 3;
    if (level <= 12) return 4;
    if (level <= 16) return 5;
    return 6; // Niveau 17-20
  }

  /**
   * Synchronise le bonus de maîtrise avec le niveau du personnage
   * @param character Personnage à mettre à jour
   * @param newLevel Nouveau niveau
   */
  syncProficiencyBonusWithLevel(character: PlayerCharacter, newLevel: number): void {
    // Trouver l'élément bonus de maîtrise
    const proficiencyBonusItem = character.dataItems.find((item: DataItem) => 
      item.type === DataType.DND_PROFICIENCY_BONUS
    );
    
    if (proficiencyBonusItem) {
      const newBonus = this.calculateProficiencyBonusFromLevel(newLevel);
      proficiencyBonusItem.value = newBonus;
      
      // Mettre à jour les métadonnées
      if (!proficiencyBonusItem.metadata) {
        proficiencyBonusItem.metadata = {};
      }
      proficiencyBonusItem.metadata['level'] = newLevel;
      
      // Sauvegarder
      this.storageService.saveDataItem(proficiencyBonusItem);
    }
  }

  // ========================================
  // Gestion des listes de sélection D&D 5e
  // ========================================

  /**
   * Charge les listes de sélection depuis le fichier JSON D&D 5e
   * et les sauvegarde dans le localStorage en tant que listes système
   */
  async loadDnd5eSelectLists(): Promise<void> {
    try {
      const dnd5eData = await this.gameSystemDataService.loadGameSystemData(GameSystem.DND5E).toPromise();
      if (!dnd5eData) {
        console.warn('Impossible de charger les données D&D 5e pour les listes');
        return;
      }

      const now = new Date();
      const lists: SelectListReference[] = [];

      // Créer la liste des classes
      if (dnd5eData.classes && Array.isArray(dnd5eData.classes)) {
        const classOptions: SelectListOption[] = dnd5eData.classes.map((c: any) => ({
          id: this.storageService.generateId(),
          label: c.name,
          value: c.name
        }));

        lists.push({
          id: 'dnd5e-classes',
          name: 'Classes D&D 5e',
          type: 'system',
          gameSystem: 'dnd5e',
          options: classOptions,
          createdAt: now,
          updatedAt: now
        });
      }

      // Créer la liste des origines
      if (dnd5eData.origines && Array.isArray(dnd5eData.origines)) {
        const origineOptions: SelectListOption[] = dnd5eData.origines.map((o: any) => ({
          id: this.storageService.generateId(),
          label: o.name,
          value: o.name
        }));

        lists.push({
          id: 'dnd5e-origines',
          name: 'Origines D&D 5e',
          type: 'system',
          gameSystem: 'dnd5e',
          options: origineOptions,
          createdAt: now,
          updatedAt: now
        });

        // Créer une liste de peuples pour chaque origine
        dnd5eData.origines.forEach((origine: any) => {
          if (origine.peuples && Array.isArray(origine.peuples) && origine.peuples.length > 0) {
            const peupleOptions: SelectListOption[] = origine.peuples.map((p: any) => ({
              id: this.storageService.generateId(),
              label: p.name,
              value: p.name
            }));

            lists.push({
              id: `dnd5e-peuples-${this.normalizeNameForId(origine.name)}`,
              name: `Peuples - ${origine.name}`,
              type: 'system',
              gameSystem: 'dnd5e',
              options: peupleOptions,
              createdAt: now,
              updatedAt: now
            });
          }
        });
      }

      // Créer les listes des historiques et leurs dépendances (traits, idéaux, liens, défauts)
      if (dnd5eData.historiques && Array.isArray(dnd5eData.historiques)) {
        const historiqueOptions: SelectListOption[] = [];

        // Créer les options principales (historiques + variantes)
        dnd5eData.historiques.forEach((historique: any) => {
          // Ajouter l'historique principal
          const historiqueId = historique.historique || historique.name?.toLowerCase().replace(/\s+/g, '-') || '';
          const historiqueName = historique.name || historique.historique || '';
          
          historiqueOptions.push({
            id: this.storageService.generateId(),
            label: historiqueName,
            value: historiqueName
          });

          // Ajouter les variantes si elles existent
          if (historique.variantes && Array.isArray(historique.variantes)) {
            historique.variantes.forEach((variante: string) => {
              historiqueOptions.push({
                id: this.storageService.generateId(),
                label: `${historiqueName} - ${variante}`,
                value: `${historiqueName} - ${variante}`
              });
            });
          }

          // Créer les listes dépendantes pour cet historique
          const normalizedId = historiqueId || this.normalizeNameForId(historiqueName);

          // Liste des traits
          if (historique.trait && Array.isArray(historique.trait)) {
            const traitOptions: SelectListOption[] = historique.trait.map((t: any) => ({
              id: this.storageService.generateId(),
              label: t.text,
              value: `${normalizedId}-trait-${t.id}`
            }));

            lists.push({
              id: `dnd5e-traits-${normalizedId}`,
              name: `Traits - ${historiqueName}`,
              type: 'system',
              gameSystem: 'dnd5e',
              options: traitOptions,
              createdAt: now,
              updatedAt: now
            });
          }

          // Liste des idéaux
          if (historique.ideal && Array.isArray(historique.ideal)) {
            const idealOptions: SelectListOption[] = historique.ideal.map((i: any) => ({
              id: this.storageService.generateId(),
              label: i.text,
              value: `${normalizedId}-ideal-${i.id}`
            }));

            lists.push({
              id: `dnd5e-ideaux-${normalizedId}`,
              name: `Idéaux - ${historiqueName}`,
              type: 'system',
              gameSystem: 'dnd5e',
              options: idealOptions,
              createdAt: now,
              updatedAt: now
            });
          }

          // Liste des liens
          if (historique.lien && Array.isArray(historique.lien)) {
            const lienOptions: SelectListOption[] = historique.lien.map((l: any) => ({
              id: this.storageService.generateId(),
              label: l.text,
              value: `${normalizedId}-lien-${l.id}`
            }));

            lists.push({
              id: `dnd5e-liens-${normalizedId}`,
              name: `Liens - ${historiqueName}`,
              type: 'system',
              gameSystem: 'dnd5e',
              options: lienOptions,
              createdAt: now,
              updatedAt: now
            });
          }

          // Liste des défauts
          if (historique.defaut && Array.isArray(historique.defaut)) {
            const defautOptions: SelectListOption[] = historique.defaut.map((d: any) => ({
              id: this.storageService.generateId(),
              label: d.text,
              value: `${normalizedId}-defaut-${d.id}`
            }));

            lists.push({
              id: `dnd5e-defauts-${normalizedId}`,
              name: `Défauts - ${historiqueName}`,
              type: 'system',
              gameSystem: 'dnd5e',
              options: defautOptions,
              createdAt: now,
              updatedAt: now
            });
          }
        });

        // Ajouter la liste principale des historiques
        lists.push({
          id: 'dnd5e-historiques',
          name: 'Historiques D&D 5e',
          type: 'system',
          gameSystem: 'dnd5e',
          options: historiqueOptions,
          createdAt: now,
          updatedAt: now
        });
      }

      // Sauvegarder toutes les listes en une fois
      if (lists.length > 0) {
        this.storageService.saveSystemSelectLists(lists);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des listes D&D 5e:', error);
    }
  }

}
