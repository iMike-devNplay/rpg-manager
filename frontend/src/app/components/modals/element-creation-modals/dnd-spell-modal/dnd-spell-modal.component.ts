import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndSpellElement } from '../../../../models/element-types';

@Component({
  selector: 'app-dnd-spell-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dnd-spell-modal.component.html',
  styleUrls: ['./dnd-spell-modal.component.scss']
})
export class DndSpellModalComponent {
  @Input() isOpen = false;
  @Input() editingElement: DndSpellElement | null = null;
  @Input() zone = '';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DndSpellElement>>();

  formData = {
    name: '',
    level: 0,
    school: '',
    castingTime: '',
    range: '',
    components: [] as string[],
    duration: '',
    description: ''
  };

  availableComponents = ['V', 'S', 'M'];
  spellSchools = [
    'Abjuration',
    'Conjuration',
    'Divination',
    'Enchantement',
    'Évocation',
    'Illusion',
    'Nécromancie',
    'Transmutation'
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
      // Mode édition
      this.formData = {
        name: this.editingElement.name,
        level: this.editingElement.level,
        school: this.editingElement.school,
        castingTime: this.editingElement.castingTime,
        range: this.editingElement.range,
        components: [...this.editingElement.components],
        duration: this.editingElement.duration,
        description: this.editingElement.description || ''
      };
    } else {
      // Mode création
      this.formData = {
        name: '',
        level: 0,
        school: this.spellSchools[0],
        castingTime: '1 action',
        range: '9 mètres',
        components: [],
        duration: 'Instantanée',
        description: ''
      };
    }
  }

  onComponentChange(component: string, checked: boolean): void {
    if (checked) {
      if (!this.formData.components.includes(component)) {
        this.formData.components.push(component);
      }
    } else {
      this.formData.components = this.formData.components.filter(c => c !== component);
    }
  }

  onSubmit(): void {
    if (!this.formData.name.trim()) {
      return;
    }

    const spellData: Partial<DndSpellElement> = {
      name: this.formData.name.trim(),
      level: this.formData.level,
      school: this.formData.school,
      castingTime: this.formData.castingTime,
      range: this.formData.range,
      components: [...this.formData.components],
      duration: this.formData.duration,
      description: this.formData.description,
      zone: this.zone,
      type: 'dnd-spell'
    };

    if (this.editingElement) {
      spellData.id = this.editingElement.id;
    }

    this.save.emit(spellData);
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}