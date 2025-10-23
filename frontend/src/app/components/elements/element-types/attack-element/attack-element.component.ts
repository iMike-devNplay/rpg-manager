import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttackElement } from '../../../../models/element-types';

@Component({
  selector: 'app-attack-element',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attack-element.component.html',
  styleUrl: './attack-element.component.scss'
})
export class AttackElementComponent {
  @Input() element!: AttackElement;
}
