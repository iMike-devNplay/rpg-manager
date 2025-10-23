import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HpElement } from '../../../../models/element-types';

@Component({
  selector: 'app-hp-element',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hp-element.component.html',
  styleUrls: ['./hp-element.component.scss']
})
export class HpElementComponent {
  @Input() element!: HpElement;
  @Input() canQuickModify: boolean = false;
  
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() hpChange = new EventEmitter<Partial<HpElement>>();

  showTempHpInput = false;
  tempHpInputValue = 0;

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  /**
   * Augmente les PV courants
   * Maximum : maxHp (les PV temporaires ne comptent pas pour le plafond)
   */
  increaseHp(): void {
    if (!this.canQuickModify) return;
    
    // Les PV courants ne peuvent jamais dépasser maxHp
    if (this.element.currentHp < this.element.maxHp) {
      const newCurrentHp = this.element.currentHp + 1;
      this.hpChange.emit({
        currentHp: newCurrentHp,
        temporaryHp: this.element.temporaryHp,
        maxHp: this.element.maxHp
      });
    }
  }

  /**
   * Diminue les PV
   * Si PV temporaires > 0 : retire 1 des PV temporaires
   * Sinon : retire 1 des PV courants (minimum 0)
   */
  decreaseHp(): void {
    if (!this.canQuickModify) return;
    
    if (this.element.currentHp <= 0 && this.element.temporaryHp <= 0) {
      return; // Déjà à 0, ne rien faire
    }

    let newCurrentHp = this.element.currentHp;
    let newTempHp = this.element.temporaryHp;

    // Si des PV temporaires existent, les retirer en premier
    if (newTempHp > 0) {
      newTempHp -= 1;
    } else {
      // Pas de PV temporaires, retirer des PV courants
      if (newCurrentHp > 0) {
        newCurrentHp -= 1;
      }
    }

    this.hpChange.emit({
      currentHp: newCurrentHp,
      temporaryHp: newTempHp,
      maxHp: this.element.maxHp
    });
  }

  /**
   * Affiche le champ de saisie pour ajouter des PV temporaires
   */
  showAddTempHp(): void {
    this.showTempHpInput = true;
    this.tempHpInputValue = 0;
  }

  /**
   * Annule l'ajout de PV temporaires
   */
  cancelTempHp(): void {
    this.showTempHpInput = false;
    this.tempHpInputValue = 0;
  }

  /**
   * Confirme l'ajout de PV temporaires
   * Les PV temporaires remplacent les anciens, les PV courants ne changent pas
   */
  confirmTempHp(): void {
    if (this.tempHpInputValue > 0) {
      this.hpChange.emit({
        currentHp: this.element.currentHp, // PV courants inchangés
        temporaryHp: this.tempHpInputValue,
        maxHp: this.element.maxHp
      });
    }
    this.showTempHpInput = false;
    this.tempHpInputValue = 0;
  }

  /**
   * Vérifie si les PV sont bas (< 25% du max)
   */
  isLowHp(): boolean {
    return this.element.currentHp <= this.element.maxHp * 0.25;
  }

  /**
   * Vérifie si les PV sont critiques (< 10% du max)
   */
  isCriticalHp(): boolean {
    return this.element.currentHp <= this.element.maxHp * 0.1;
  }

  /**
   * Calcule le pourcentage de PV restants (pour une barre de progression)
   */
  getHpPercentage(): number {
    return Math.max(0, Math.min(100, (this.element.currentHp / this.element.maxHp) * 100));
  }
}
