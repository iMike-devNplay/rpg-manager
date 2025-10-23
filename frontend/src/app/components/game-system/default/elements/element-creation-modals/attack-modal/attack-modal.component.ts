import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttackElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-attack-modal',
  templateUrl: './attack-modal.component.html',
  styleUrls: ['./attack-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AttackModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() editingElement: AttackElement | null = null;
  @Input() zone = '';
  
  @Output() save = new EventEmitter<Partial<AttackElement>>();
  @Output() close = new EventEmitter<void>();

  attackData: Partial<AttackElement> = {
    type: 'attack',
    name: '',
    attackBonus: '',
    damage: '',
    misc: ''
  };

  ngOnInit() {
    if (this.editingElement) {
      this.attackData = { ...this.editingElement };
    }
  }

  onSave() {
    if (!this.attackData.name?.trim()) {
      alert('Veuillez saisir un nom pour l\'attaque');
      return;
    }

    this.save.emit({
      ...this.attackData,
      zone: this.zone
    });
  }

  onClose() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }
}
