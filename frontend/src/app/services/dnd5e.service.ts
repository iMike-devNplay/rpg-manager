import { Injectable } from '@angular/core';
import { GameSystemDataService, GameSystemData } from './game-system-data.service';
import { DataItem, DataType, DashboardZone, PlayerCharacter, GameSystem } from '../models/rpg.models';
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
   * Initialise un personnage D&D 5e avec les éléments de base
   */
  async initializeDnd5eCharacter(character: PlayerCharacter): Promise<void> {
    console.log('=== Initialisation D&D 5e démarrée ===');
    try {
      const dnd5eData = await this.gameSystemDataService.loadGameSystemData(GameSystem.DND5E).toPromise();
      console.log('Données D&D 5e chargées:', dnd5eData);
      if (!dnd5eData) {
        throw new Error('Impossible de charger les données D&D 5e');
      }

      const elementsToCreate: DataItem[] = [];

      // 4a - Création du nouveau bonus de maîtrise D&D
      console.log('Création du bonus de maîtrise D&D...');
      elementsToCreate.push(this.createDndProficiencyBonus(character.userId));

      // 4a-bis - Création du niveau D&D
      console.log('Création du niveau D&D...');
      elementsToCreate.push(this.createDndLevel(character.userId));

      // 4a-ter - Création du groupe d'attributs
      console.log('Création du groupe d\'attributs...');
      elementsToCreate.push(this.createAttributesGroup(character.userId));

      // 4a-qua - Création du groupe de compétences
      console.log('Création du groupe de compétences...');
      elementsToCreate.push(this.createSkillsGroup(character.userId));

      // 4b - Anciens attributs individuels désactivés - remplacés par le groupe d'attributs
      /*
      if (dnd5eData.attributes) {
        console.log('Création des attributs:', dnd5eData.attributes.length);
        dnd5eData.attributes.forEach((attr: any) => {
          elementsToCreate.push(this.createAttribute(attr, character.userId));
        });
      }
      */

      // 4d - Création de l'élément Origine
      if (dnd5eData.origins) {
        console.log('Création de l\'origine...');
        elementsToCreate.push(this.createOriginElement(dnd5eData.origins, character.userId));
      }

      // 4e - Création de l'élément Classe
      if (dnd5eData.classes) {
        console.log('Création de la classe...');
        elementsToCreate.push(this.createClassElement(dnd5eData.classes, character.userId));
      }

      console.log('Éléments à créer:', elementsToCreate.length);

      // Sauvegarder tous les éléments directement sur le personnage
      for (const element of elementsToCreate) {
        console.log('Sauvegarde de:', element.name);
        // Ajouter directement à la liste des dataItems du personnage
        if (!character.dataItems) {
          character.dataItems = [];
        }
        character.dataItems.push(element);
      }

      // Mettre à jour le personnage dans le storage
      this.storageService.updateCharacter(character);

      console.log('=== Initialisation D&D 5e terminée ===');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du personnage D&D 5e:', error);
      throw error;
    }
  }

  /**
   * Crée l'élément bonus de maîtrise (ancien - à supprimer)
   */
  private createProficiencyBonus(userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Bonus de maîtrise',
      type: DataType.NUMERIC,
      value: 2, // 4f-1 - par défaut à 2
      zone: DashboardZone.TOP,
      order: 0,
      userId,
      description: 'Bonus de maîtrise du personnage (augmente avec le niveau)',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'proficiency-bonus'
      }
    };
  }

  /**
   * Crée l'élément bonus de maîtrise D&D spécialisé
   */
  private createDndProficiencyBonus(userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Bonus de maîtrise',
      type: DataType.DND_PROFICIENCY_BONUS,
      value: 2, // Valeur par défaut
      zone: DashboardZone.TOP,
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
  private createDndLevel(userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Niveau',
      type: DataType.DND_LEVEL,
      value: 1, // Niveau par défaut
      zone: DashboardZone.TOP,
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
  private createSkillsGroup(userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Compétences',
      type: DataType.DND_SKILLS_GROUP,
      value: 'Compétences', // Nom d'affichage
      zone: DashboardZone.CENTER,
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
  private createAttributesGroup(userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Attributs',
      type: DataType.ATTRIBUTES_GROUP,
      value: 'Attributs', // Nom d'affichage
      zone: DashboardZone.LEFT,
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
   * Crée un élément attribut
   */
  private createAttribute(attrData: any, userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: attrData.name,
      type: DataType.ATTRIBUTE,
      value: 10, // 4f-2 - valeur par défaut à 10
      zone: DashboardZone.LEFT,
      order: attrData.order || 0,
      userId,
      description: attrData.description || '',
      allowQuickModification: true,
      hasProficiency: false,
      metadata: {
        dnd5eType: 'attribute',
        attributeCode: attrData.attribute
      }
    };
  }

  /**
   * Crée l'élément Origine
   */
  private createOriginElement(origins: any[], userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Origine',
      type: DataType.TEXT,
      value: 'Non définie',
      zone: DashboardZone.TOP,
      order: 1,
      userId,
      description: 'Origine/Race du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'origin',
        availableOptions: origins
      }
    };
  }

  /**
   * Crée l'élément Classe
   */
  private createClassElement(classes: any[], userId: string): DataItem {
    return {
      id: this.storageService.generateId(),
      name: 'Classe',
      type: DataType.TEXT,
      value: 'Non définie',
      zone: DashboardZone.TOP,
      order: 2,
      userId,
      description: 'Classe du personnage',
      allowQuickModification: true,
      metadata: {
        dnd5eType: 'class',
        availableOptions: classes
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
      
      console.log(`Bonus de maîtrise mis à jour: niveau ${newLevel} → bonus +${newBonus}`);
    }
  }
}