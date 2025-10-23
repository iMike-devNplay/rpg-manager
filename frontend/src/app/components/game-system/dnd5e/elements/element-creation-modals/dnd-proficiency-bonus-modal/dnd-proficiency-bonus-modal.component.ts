import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndProficiencyBonusElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-dnd-proficiency-bonus-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dnd-proficiency-bonus-modal.component.html',
  styleUrls: ['./dnd-proficiency-bonus-modal.component.scss']
})
export class DndProficiencyBonusModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: DndProficiencyBonusElement | null = null;
  @Input() zone = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DndProficiencyBonusElement>>();

  formData = {
    name: 'Bonus de maîtrise',
    value: 2,
    level: 1,
    description: 'Bonus de maîtrise du personnage (augmente avec le niveau)'
  };

  // Correspondance niveau/bonus selon D&D 5e
  proficiencyTable = [
    { level: 1, bonus: 2, range: "1-4" },
    { level: 5, bonus: 3, range: "5-8" },
    { level: 9, bonus: 4, range: "9-12" },
    { level: 13, bonus: 5, range: "13-16" },
    { level: 17, bonus: 6, range: "17-20" }
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    if (this.editingElement) {
      this.formData = {
        name: this.editingElement.name,
        value: this.editingElement.value,
        level: this.editingElement.level || this.getLevelFromBonus(this.editingElement.value),
        description: this.editingElement.description || ''
      };
    } else {
      this.formData = {
        name: 'Bonus de maîtrise',
        value: 2,
        level: 1,
        description: 'Bonus de maîtrise du personnage (augmente avec le niveau)'
      };
    }
  }

  onSave(): void {
    if (!this.isFormValid()) return;

    const elementData: Partial<DndProficiencyBonusElement> = {
      type: 'dnd-proficiency-bonus',
      name: this.formData.name.trim(),
      value: this.formData.value,
      level: this.formData.level,
      description: this.formData.description.trim() || undefined,
      zone: this.zone
    };

    if (this.editingElement) {
      elementData.id = this.editingElement.id;
    }

    this.save.emit(elementData);
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  // Calcul automatique du bonus selon le niveau
  onLevelChange(): void {
    this.formData.value = this.getBonusFromLevel(this.formData.level);
  }

  // Calcul automatique du niveau selon le bonus
  onBonusChange(): void {
    this.formData.level = this.getLevelFromBonus(this.formData.value);
  }

  private getBonusFromLevel(level: number): number {
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
  }

  private getLevelFromBonus(bonus: number): number {
    if (bonus >= 6) return 17;
    if (bonus >= 5) return 13;
    if (bonus >= 4) return 9;
    if (bonus >= 3) return 5;
    return 1;
  }

  isFormValid(): boolean {
    return this.formData.name.trim().length > 0 && 
           this.formData.value >= 2 && 
           this.formData.value <= 6 &&
           this.formData.level >= 1 && 
           this.formData.level <= 20;
  }

  getCurrentRange(): string {
    const entry = this.proficiencyTable.find(item => item.bonus === this.formData.value);
    return entry ? entry.range : "1-4";
  }
}