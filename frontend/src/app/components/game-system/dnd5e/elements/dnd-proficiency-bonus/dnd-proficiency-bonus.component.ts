import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DndProficiencyBonusElement } from '../../../../../models/element-types';

@Component({
  selector: 'app-dnd-proficiency-bonus',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd-proficiency-bonus.component.html',
  styleUrls: ['./dnd-proficiency-bonus.component.scss']
})
export class DndProficiencyBonusComponent {
  @Input() element!: DndProficiencyBonusElement;

  getDisplayValue(): string {
    return this.element.value >= 0 ? `+${this.element.value}` : `${this.element.value}`;
  }
}