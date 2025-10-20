import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndSpellElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-dnd-spell-element',
  templateUrl: './dnd-spell-element.component.html',
  styleUrls: ['./dnd-spell-element.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class DndSpellElementComponent {
  @Input() element!: DndSpellElement;

  getSpellLevel(): string {
    if (this.element.level === 0) {
      return 'Tour de magie';
    }
    return `Niveau ${this.element.level}`;
  }

  getComponentsString(): string {
    return this.element.components.join(', ');
  }
}