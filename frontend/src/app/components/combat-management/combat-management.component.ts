import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CombatParticipant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  isPlayer: boolean;
  conditions: string[];
}

@Component({
  selector: 'app-combat-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combat-management.component.html',
  styleUrls: ['./combat-management.component.scss']
})
export class CombatManagementComponent {
  participants: CombatParticipant[] = [];
  currentTurn: number = 0;
  round: number = 1;
  isCombatActive: boolean = false;
  
  // Formulaire d'ajout de participant
  newParticipant = {
    name: '',
    initiative: 0,
    hp: 0,
    maxHp: 0,
    ac: 10,
    isPlayer: false
  };

  addParticipant() {
    if (this.newParticipant.name.trim()) {
      const participant: CombatParticipant = {
        id: Date.now().toString(),
        name: this.newParticipant.name.trim(),
        initiative: this.newParticipant.initiative,
        hp: this.newParticipant.hp || this.newParticipant.maxHp,
        maxHp: this.newParticipant.maxHp,
        ac: this.newParticipant.ac,
        isPlayer: this.newParticipant.isPlayer,
        conditions: []
      };
      
      this.participants.push(participant);
      this.sortByInitiative();
      this.resetForm();
    }
  }

  removeParticipant(id: string) {
    const index = this.participants.findIndex(p => p.id === id);
    if (index !== -1) {
      this.participants.splice(index, 1);
      if (this.currentTurn >= this.participants.length) {
        this.currentTurn = 0;
      }
    }
  }

  startCombat() {
    if (this.participants.length > 0) {
      this.sortByInitiative();
      this.currentTurn = 0;
      this.round = 1;
      this.isCombatActive = true;
    }
  }

  nextTurn() {
    this.currentTurn++;
    if (this.currentTurn >= this.participants.length) {
      this.currentTurn = 0;
      this.round++;
    }
  }

  previousTurn() {
    this.currentTurn--;
    if (this.currentTurn < 0) {
      this.currentTurn = this.participants.length - 1;
      this.round = Math.max(1, this.round - 1);
    }
  }

  endCombat() {
    this.isCombatActive = false;
    this.currentTurn = 0;
    this.round = 1;
  }

  resetCombat() {
    this.participants = [];
    this.endCombat();
  }

  private sortByInitiative() {
    this.participants.sort((a, b) => b.initiative - a.initiative);
  }

  private resetForm() {
    this.newParticipant = {
      name: '',
      initiative: 0,
      hp: 0,
      maxHp: 0,
      ac: 10,
      isPlayer: false
    };
  }

  updateHp(participant: CombatParticipant, change: number) {
    participant.hp = Math.max(0, Math.min(participant.maxHp, participant.hp + change));
  }

  getHpPercentage(participant: CombatParticipant): number {
    return (participant.hp / participant.maxHp) * 100;
  }

  getHpStatus(participant: CombatParticipant): string {
    const percentage = this.getHpPercentage(participant);
    if (percentage === 0) return 'dead';
    if (percentage <= 25) return 'critical';
    if (percentage <= 50) return 'wounded';
    return 'healthy';
  }
}