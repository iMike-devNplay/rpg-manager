import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElementTypeConfig, GameSystem, ElementType } from '../../../../../models/element-types';
import { ElementTypeService } from '../../../../../services/element-type.service';

@Component({
  selector: 'app-element-type-selection-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './element-type-selection-modal.component.html',
  styleUrls: ['./element-type-selection-modal.component.scss']
})
export class ElementTypeSelectionModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() gameSystem: GameSystem = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() typeSelected = new EventEmitter<ElementType>();

  categorizedTypes: Record<string, ElementTypeConfig[]> = {};
  categoryNames: Record<string, string> = {
    'basic': 'Éléments de base',
    'attribute': 'Caractéristiques',
    'combat': 'Combat',
    'magic': 'Magie',
    'equipment': 'Équipement'
  };

  ngOnInit(): void {
    this.loadAvailableTypes();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.loadAvailableTypes();
    }
  }

  private loadAvailableTypes(): void {
    this.categorizedTypes = ElementTypeService.getTypesByCategory(this.gameSystem);
  }

  selectType(type: ElementType): void {
    this.typeSelected.emit(type);
    // Ne pas fermer ici, laisser l'orchestrateur gérer la transition
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getCategoryKeys(): string[] {
    return Object.keys(this.categorizedTypes);
  }

  getCategoryName(key: string): string {
    return this.categoryNames[key] || key;
  }
}