import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataItem, DataType } from '../../../models/rpg.models';
import { ElementService } from '../../../services/element.service';

@Component({
  selector: 'app-element-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './element-display.component.html',
  styleUrls: ['./element-display.component.scss']
})
export class ElementDisplayComponent {
  @Input() item!: DataItem;
  @Input() showQuickModification = false;
  @Output() itemUpdated = new EventEmitter<DataItem>();
  @Output() itemDeleted = new EventEmitter<DataItem>();
  @Output() itemEdit = new EventEmitter<DataItem>();
  @Output() itemDragStart = new EventEmitter<DataItem>();
  @Output() itemDragEnd = new EventEmitter<void>();

  constructor(private elementService: ElementService) {}

  /**
   * Vérifie si l'élément peut être modifié rapidement
   */
  canQuickModify(): boolean {
    return this.showQuickModification && 
           this.item.allowQuickModification !== false &&
           (this.item.type === DataType.NUMERIC || 
            this.item.type === DataType.ATTRIBUTE || 
            this.item.type === DataType.PROFICIENCY_BONUS);
  }

  /**
   * Modifie rapidement la valeur
   */
  quickModify(change: number): void {
    if (this.canQuickModify()) {
      const updatedItem = this.elementService.quickModifyValue(this.item, change);
      this.itemUpdated.emit(updatedItem);
    }
  }

  /**
   * Supprime l'élément
   */
  deleteItem(): void {
    this.itemDeleted.emit(this.item);
  }

  /**
   * Ouvre la modal d'édition de l'élément
   */
  editItem(): void {
    this.itemEdit.emit(this.item);
  }

  /**
   * Obtient la valeur formatée pour l'affichage
   */
  getFormattedValue(): string {
    return this.elementService.formatElementValue(this.item);
  }

  /**
   * Obtient les détails de l'attribut (modificateur et jet de sauvegarde)
   */
  getAttributeDetails(): any {
    if (this.item.type === DataType.ATTRIBUTE) {
      return this.elementService.getAttributeDetails(this.item);
    }
    return null;
  }

  /**
   * Vérifie si c'est un élément textuel
   */
  isTextElement(): boolean {
    return this.item.type === DataType.TEXT;
  }

  /**
   * Vérifie si c'est un élément numérique (incluant attributs)
   */
  isNumericElement(): boolean {
    return this.item.type === DataType.NUMERIC || 
           this.item.type === DataType.ATTRIBUTE || 
           this.item.type === DataType.PROFICIENCY_BONUS;
  }

  /**
   * Vérifie si c'est un attribut D&D
   */
  isAttribute(): boolean {
    return this.item.type === DataType.ATTRIBUTE;
  }

  /**
   * Gestion du début de drag
   */
  onDragStart(event: DragEvent): void {
    // Stocker l'ID de l'élément dans le dataTransfer
    event.dataTransfer?.setData('text/plain', this.item.id);
    
    // Ajouter une classe CSS pour le style pendant le drag
    (event.target as HTMLElement).classList.add('dragging');
    
    // Notifier le parent
    this.itemDragStart.emit(this.item);
  }

  /**
   * Gestion de la fin de drag
   */
  onDragEnd(event: DragEvent): void {
    // Retirer la classe CSS
    (event.target as HTMLElement).classList.remove('dragging');
    
    // Notifier le parent
    this.itemDragEnd.emit();
  }
}