import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HpElement } from '../../../../../../models/element-types';

@Component({
  selector: 'app-hp-modal',
  templateUrl: './hp-modal.component.html',
  styleUrls: ['./hp-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class HpModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() editingElement: HpElement | null = null;
  @Input() zone = '';
  
  @Output() save = new EventEmitter<Partial<HpElement>>();
  @Output() close = new EventEmitter<void>();

  hpData: Partial<HpElement> = {
    type: 'hp',
    name: 'Points de vie',
    maxHp: 10,
    currentHp: 10,
    temporaryHp: 0
  };

  ngOnInit() {
    if (this.editingElement) {
      this.hpData = { ...this.editingElement };
    } else {
      // Par défaut, les PV courants = PV max lors de la création
      this.hpData.currentHp = this.hpData.maxHp;
    }
  }

  /**
   * Met à jour les PV courants quand on change les PV max
   * (seulement en mode création ou si les PV courants étaient au max)
   */
  onMaxHpChange() {
    if (!this.editingElement) {
      // En création, garder les PV courants = PV max
      this.hpData.currentHp = this.hpData.maxHp;
    } else {
      // En édition, limiter les PV courants si nécessaire
      if (this.hpData.currentHp! > this.hpData.maxHp!) {
        this.hpData.currentHp = this.hpData.maxHp;
      }
    }
  }

  onSubmit() {
    if (this.zone) {
      this.hpData.zone = this.zone;
    }

    // Validation
    if (!this.hpData.name || this.hpData.name.trim() === '') {
      this.hpData.name = 'Points de vie';
    }

    if (!this.hpData.maxHp || this.hpData.maxHp < 1) {
      this.hpData.maxHp = 1;
    }

    if (!this.hpData.currentHp || this.hpData.currentHp < 0) {
      this.hpData.currentHp = 0;
    }

    if (!this.hpData.temporaryHp || this.hpData.temporaryHp < 0) {
      this.hpData.temporaryHp = 0;
    }

    // S'assurer que currentHp ne dépasse pas maxHp + temporaryHp
    const maxAllowed = this.hpData.maxHp + this.hpData.temporaryHp;
    if (this.hpData.currentHp > maxAllowed) {
      this.hpData.currentHp = maxAllowed;
    }

    this.save.emit(this.hpData);
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
