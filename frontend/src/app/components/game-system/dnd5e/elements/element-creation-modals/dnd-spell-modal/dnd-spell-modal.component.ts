import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DndSpellElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-dnd-spell-modal',
  templateUrl: './dnd-spell-modal.component.html',
  styleUrls: ['./dnd-spell-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DndSpellModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() editingElement: DndSpellElement | null = null;
  @Input() zone = '';
  
  @Output() save = new EventEmitter<Partial<DndSpellElement>>();
  @Output() close = new EventEmitter<void>();

  spellData: Partial<DndSpellElement> = {
    type: 'dnd-spell',
    level: 0,
    school: '',
    castingTime: '',
    range: '',
    components: [],
    duration: '',
    description: ''
  };

  componentOptions = ['V', 'S', 'M'];
  selectedComponents: { [key: string]: boolean } = {
    V: false,
    S: false,
    M: false
  };

  schools = [
    'Abjuration',
    'Invocation',
    'Divination',
    'Enchantement',
    'Évocation',
    'Illusion',
    'Nécromancie',
    'Transmutation'
  ];

  updateComponents() {
    this.spellData.components = Object.entries(this.selectedComponents)
      .filter(([_, selected]) => selected)
      .map(([component]) => component);
  }

  ngOnInit() {
    if (this.editingElement) {
      this.spellData = { ...this.editingElement };
      this.selectedComponents = {
        V: this.editingElement.components.includes('V'),
        S: this.editingElement.components.includes('S'),
        M: this.editingElement.components.includes('M')
      };
    }
  }

  onSubmit() {
    this.updateComponents();
    if (this.zone) {
      this.spellData.zone = this.zone;
    }
    this.save.emit(this.spellData);
  }

  onCancel() {
    this.close.emit();
  }
    onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
        this.close.emit();
    }
}
}