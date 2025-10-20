import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElementTypeSelectionModalComponent } from '../element-type-selection-modal/element-type-selection-modal.component';
import { TextElementModalComponent } from '../element-creation-modals/text-element-modal/text-element-modal.component';
import { NumericElementModalComponent } from '../element-creation-modals/numeric-element-modal/numeric-element-modal.component';
import { DndAttributeModalComponent } from '../element-creation-modals/dnd-attribute-modal/dnd-attribute-modal.component';
import { DndSpellModalComponent } from '../element-creation-modals/dnd-spell-modal/dnd-spell-modal.component';
import { EquipmentModalComponent } from '../element-creation-modals/equipment-modal/equipment-modal.component';
import { ElementType, Element, GameSystem } from '../../../models/element-types';

@Component({
  selector: 'app-element-creation-orchestrator',
  standalone: true,
  imports: [
    CommonModule,
    ElementTypeSelectionModalComponent,
    TextElementModalComponent,
    NumericElementModalComponent,
    DndAttributeModalComponent,
    DndSpellModalComponent,
    EquipmentModalComponent
  ],
  templateUrl: './element-creation-orchestrator.component.html',
  styleUrls: ['./element-creation-orchestrator.component.scss']
})
export class ElementCreationOrchestratorComponent {
  @Input() isOpen = false;
  @Input() gameSystem: GameSystem = null;
  @Input() zone = '';
  @Input() editingElement: Element | null = null; // null = création, sinon édition
  
  @Output() close = new EventEmitter<void>();
  @Output() elementSaved = new EventEmitter<Partial<Element>>();

  // État des modals
  showTypeSelection = false;
  showElementModal = false;
  selectedType: ElementType | null = null;

  ngOnChanges(): void {
    if (this.isOpen) {
      if (this.editingElement) {
        // Mode édition : aller directement à la modal spécifique
        this.selectedType = this.editingElement.type;
        this.showElementModal = true;
        this.showTypeSelection = false;
      } else {
        // Mode création : commencer par la sélection de type
        this.showTypeSelection = true;
        this.showElementModal = false;
        this.selectedType = null;
      }
    } else {
      this.resetState();
    }
  }

  private resetState(): void {
    this.showTypeSelection = false;
    this.showElementModal = false;
    this.selectedType = null;
  }

  onTypeSelected(type: ElementType): void {
    this.selectedType = type;
    // Ouvrir immédiatement la modal spécifique
    this.showTypeSelection = false;
    this.showElementModal = true;
  }

  onTypeSelectionClose(): void {
    this.close.emit();
  }

  onElementModalClose(): void {
    if (this.editingElement) {
      // En mode édition, fermer complètement
      this.close.emit();
    } else {
      // En mode création, retourner à la sélection de type
      this.showElementModal = false;
      this.showTypeSelection = true;
      this.selectedType = null;
    }
  }

  onElementSaved(elementData: Partial<Element>): void {
    this.elementSaved.emit(elementData);
    this.close.emit();
  }

  // Getters pour les éléments typés (casting sécurisé)
  get textElement() {
    return this.editingElement?.type === 'text' ? this.editingElement : null;
  }

  get numericElement() {
    return this.editingElement?.type === 'numeric' ? this.editingElement : null;
  }

  get dndAttributeElement() {
    return this.editingElement?.type === 'dnd-attribute' ? this.editingElement : null;
  }

  get equipmentElement() {
    return this.editingElement?.type === 'equipment' ? this.editingElement : null;
  }

  get dndSpellElement() {
    return this.editingElement?.type === 'dnd-spell' ? this.editingElement : null;
  }
}