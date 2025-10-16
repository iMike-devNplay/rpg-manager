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
      hasProficiency: elementData.hasProficiency,
      allowQuickModification: elementData.allowQuickModification
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
   * Met à jour un élément existant avec tous les calculs automatiques
   * @param elementData Données de l'élément à mettre à jour (avec ID)
   * @returns L'élément mis à jour avec calculs
   */
  updateElement(elementData: any): DataItem {
    const updatedItem: DataItem = {
      id: elementData.id, // Garder l'ID existant
      name: elementData.name,
      type: elementData.type,
      value: elementData.value,
      description: elementData.description,
      zone: elementData.zone,
      order: 0,
      userId: this.storageService.getCurrentUser()?.id || '',
      hasProficiency: elementData.hasProficiency,
      allowQuickModification: elementData.allowQuickModification
    };

    // Traitement spécial pour les attributs
    if (elementData.type === DataType.ATTRIBUTE) {
      let proficiencyBonus = 2;
      
      if (elementData.hasProficiency) {
        // Récupérer le bonus de maîtrise existant
        proficiencyBonus = this.getProficiencyBonusValue();
        const proficiencyBonusItem = this.findOrCreateProficiencyBonus(
          updatedItem.userId, 
          proficiencyBonus
        );
        updatedItem.proficiencyBonusRef = proficiencyBonusItem.id;
      }
      
      // Recalculer les propriétés
      this.updateAttributeCalculations(updatedItem, proficiencyBonus);
    }

    return updatedItem;
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
        const value = Number(item.value);
        const modifier = item.modifier !== undefined ? item.modifier : this.calculateModifier(value);
        const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
        
        return `${value} (${modifierStr})`;
        
      case DataType.PROFICIENCY_BONUS:
        const bonus = Number(item.value);
        return bonus >= 0 ? `+${bonus}` : `${bonus}`;
        
      default:
        return String(item.value);
    }
  }

  /**
   * Obtient les détails d'affichage d'un attribut
   * @param item Élément attribut
   * @returns Détails formatés
   */
  getAttributeDetails(item: DataItem): {modifier: string, savingThrow: string} {
    if (item.type !== DataType.ATTRIBUTE) return {modifier: '', savingThrow: ''};
    
    const value = Number(item.value);
    const modifier = item.modifier !== undefined ? item.modifier : this.calculateModifier(value);
    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    
    // Calculer le jet de sauvegarde
    let savingThrow = modifier; // Par défaut, égal au modificateur
    
    if (item.hasProficiency) {
      // Si proficient, utiliser la valeur calculée ou ajouter le bonus de maîtrise
      if (item.savingThrow !== undefined) {
        savingThrow = item.savingThrow;
      } else {
        const proficiencyBonus = this.getProficiencyBonusValue();
        savingThrow = modifier + proficiencyBonus;
      }
    }
    
    const savingThrowStr = savingThrow >= 0 ? `+${savingThrow}` : `${savingThrow}`;
    
    return {
      modifier: modifierStr,
      savingThrow: savingThrowStr
    };
  }

  /**
   * Modifie rapidement la valeur d'un élément numérique
   * @param item Élément à modifier
   * @param change Changement à appliquer (+ ou -)
   * @returns L'élément modifié
   */
  quickModifyValue(item: DataItem, change: number): DataItem {
    if (item.type === DataType.NUMERIC || item.type === DataType.ATTRIBUTE || item.type === DataType.PROFICIENCY_BONUS) {
      const currentValue = Number(item.value) || 0;
      let newValue = currentValue + change;
      
      // Contraintes spécifiques
      if (item.type === DataType.ATTRIBUTE) {
        newValue = Math.max(1, Math.min(30, newValue)); // Attributs entre 1 et 30
      } else if (item.type === DataType.PROFICIENCY_BONUS) {
        newValue = Math.max(1, Math.min(6, newValue)); // Bonus entre 1 et 6
      }
      
      item.value = newValue;
      
      // Recalculer pour les attributs
      if (item.type === DataType.ATTRIBUTE) {
        const proficiencyBonus = this.getProficiencyBonusValue();
        this.updateAttributeCalculations(item, proficiencyBonus);
      }
      
      // Mettre à jour les autres attributs si c'est un bonus de maîtrise
      if (item.type === DataType.PROFICIENCY_BONUS) {
        this.updateAllAttributesWithProficiency(newValue);
      }
      
      // Sauvegarder l'élément modifié
      this.storageService.saveDataItem(item);
    }
    
    return item;
  }
}