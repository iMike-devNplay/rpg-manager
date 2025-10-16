import { Injectable } from '@angular/core';
import { DataItem, DataType, DashboardZone } from '../models/rpg.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ElementService {
  private readonly PROFICIENCY_BONUS_NAME = 'Bonus de maîtrise';

  constructor(private storageService: StorageService) {}

  /**
   * Calcule le modificateur d'un attribut selon la formule D&D
   * @param value Valeur de l'attribut (1-30)
   * @returns Modificateur calculé
   */
  calculateModifier(value: number): number {
    return Math.floor((value - 10) / 2);
  }

  /**
   * Calcule le jet de sauvegarde d'un attribut
   * @param attributeValue Valeur de l'attribut
   * @param proficiencyBonus Bonus de maîtrise
   * @returns Jet de sauvegarde calculé
   */
  calculateSavingThrow(attributeValue: number, proficiencyBonus: number): number {
    return this.calculateModifier(attributeValue) + proficiencyBonus;
  }

  /**
   * Met à jour les propriétés calculées d'un élément attribut
   * @param item Élément à mettre à jour
   * @param proficiencyBonus Bonus de maîtrise (optionnel)
   */
  updateAttributeCalculations(item: DataItem, proficiencyBonus?: number): void {
    if (item.type === DataType.ATTRIBUTE && typeof item.value === 'number') {
      item.modifier = this.calculateModifier(item.value);
      
      if (item.hasProficiency && proficiencyBonus !== undefined) {
        item.savingThrow = this.calculateSavingThrow(item.value, proficiencyBonus);
      }
    }
  }

  /**
   * Trouve ou crée un élément bonus de maîtrise
   * @param characterId ID du personnage
   * @param defaultValue Valeur par défaut si création nécessaire
   * @returns L'élément bonus de maîtrise
   */
  findOrCreateProficiencyBonus(characterId: string, defaultValue: number = 2): DataItem {
    const currentCharacter = this.storageService.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error('Aucun personnage actuel');
    }

    // Chercher un bonus de maîtrise existant
    const existingBonus = currentCharacter.dataItems.find(
      item => item.type === DataType.PROFICIENCY_BONUS
    );

    if (existingBonus) {
      return existingBonus;
    }

    // Créer un nouveau bonus de maîtrise
    const newProficiencyBonus: DataItem = {
      id: this.generateId(),
      name: this.PROFICIENCY_BONUS_NAME,
      type: DataType.PROFICIENCY_BONUS,
      value: defaultValue,
      description: 'Bonus de maîtrise du personnage',
      zone: DashboardZone.LEFT, // Zone par défaut
      order: 0,
      userId: currentCharacter.userId
    };

    // Sauvegarder l'élément
    this.storageService.saveDataItem(newProficiencyBonus);
    
    return newProficiencyBonus;
  }

  /**
   * Récupère la valeur du bonus de maîtrise pour un personnage
   * @param characterId ID du personnage
   * @returns Valeur du bonus de maîtrise ou 2 par défaut
   */
  getProficiencyBonusValue(characterId?: string): number {
    const currentCharacter = this.storageService.getCurrentCharacter();
    if (!currentCharacter) return 2;

    const proficiencyBonus = currentCharacter.dataItems.find(
      item => item.type === DataType.PROFICIENCY_BONUS
    );

    return proficiencyBonus ? Number(proficiencyBonus.value) || 2 : 2;
  }

  /**
   * Met à jour tous les attributs qui utilisent la maîtrise quand le bonus change
   * @param newProficiencyValue Nouvelle valeur du bonus de maîtrise
   */
  updateAllAttributesWithProficiency(newProficiencyValue: number): void {
    const currentCharacter = this.storageService.getCurrentCharacter();
    if (!currentCharacter) return;

    const attributesWithProficiency = currentCharacter.dataItems.filter(
      item => item.type === DataType.ATTRIBUTE && item.hasProficiency
    );

    attributesWithProficiency.forEach(attribute => {
      this.updateAttributeCalculations(attribute, newProficiencyValue);
      this.storageService.saveDataItem(attribute);
    });
  }

  /**
   * Crée un élément avec tous les calculs automatiques
   * @param elementData Données de l'élément à créer
   * @returns L'élément créé avec calculs
   */
  createElement(elementData: any): DataItem {
    const newItem: DataItem = {
      id: this.generateId(),
      name: elementData.name,
      type: elementData.type,
      value: elementData.value,
      description: elementData.description,
      zone: elementData.zone,
      order: 0,
      userId: this.storageService.getCurrentUser()?.id || '',
      hasProficiency: elementData.hasProficiency
    };

    // Traitement spécial pour les attributs
    if (elementData.type === DataType.ATTRIBUTE) {
      let proficiencyBonus = 2;
      
      if (elementData.hasProficiency) {
        // Créer ou récupérer le bonus de maîtrise
        const proficiencyBonusItem = this.findOrCreateProficiencyBonus(
          newItem.userId, 
          elementData.proficiencyBonusValue || 2
        );
        proficiencyBonus = Number(proficiencyBonusItem.value);
        newItem.proficiencyBonusRef = proficiencyBonusItem.id;
      }

      // Calculer les propriétés
      this.updateAttributeCalculations(newItem, proficiencyBonus);
    }

    return newItem;
  }

  /**
   * Génère un ID unique
   * @returns ID généré
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Obtient le label d'affichage pour un type d'élément
   * @param type Type de l'élément
   * @returns Label à afficher
   */
  getElementTypeLabel(type: DataType): string {
    switch (type) {
      case DataType.NUMERIC:
        return 'Numérique';
      case DataType.TEXT:
        return 'Texte';
      case DataType.ATTRIBUTE:
        return 'Attribut';
      case DataType.PROFICIENCY_BONUS:
        return 'Bonus de maîtrise';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Formate la valeur d'affichage d'un élément
   * @param item Élément à formater
   * @returns Valeur formatée pour l'affichage
   */
  formatElementValue(item: DataItem): string {
    switch (item.type) {
      case DataType.ATTRIBUTE:
        const modifier = item.modifier || 0;
        const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        let result = `${item.value} (${modifierStr})`;
        
        if (item.hasProficiency && item.savingThrow !== undefined) {
          const savingThrowStr = item.savingThrow >= 0 ? `+${item.savingThrow}` : `${item.savingThrow}`;
          result += ` | Sauvegarde: ${savingThrowStr}`;
        }
        
        return result;
        
      case DataType.PROFICIENCY_BONUS:
        const bonus = Number(item.value);
        return bonus >= 0 ? `+${bonus}` : `${bonus}`;
        
      default:
        return String(item.value);
    }
  }
}