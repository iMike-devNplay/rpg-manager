import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdventureService } from '../../../services/adventure.service';
import { StorageService } from '../../../services/storage.service';
import { Adventure, PlayerCharacter } from '../../../models/rpg.models';

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

interface AdventureCharacterInfo {
  character: PlayerCharacter;
  userName: string;
}

@Component({
  selector: 'app-combat-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combat-management.component.html',
  styleUrls: ['./combat-management.component.scss']
})
export class CombatManagementComponent implements OnInit {
  participants: CombatParticipant[] = [];
  currentTurn: number = 0;
  round: number = 1;
  isCombatActive: boolean = false;
  
  // Gestion de l'aventure liée
  adventureId: string | null = null;
  adventure: Adventure | null = null;
  adventureCharacters: AdventureCharacterInfo[] = [];
  showCharacterSelect: boolean = false;
  
  // Formulaire d'ajout de participant
  newParticipant = {
    name: '',
    initiative: 0,
    hp: 0,
    maxHp: 0,
    ac: 10,
    isPlayer: false
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adventureService: AdventureService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    // Récupérer l'ID de l'aventure depuis les paramètres de requête
    this.route.queryParams.subscribe(params => {
      this.adventureId = params['adventureId'] || null;
      if (this.adventureId) {
        this.loadAdventure();
      }
    });
  }

  loadAdventure() {
    if (!this.adventureId) return;
    
    this.adventure = this.adventureService.getAdventureById(this.adventureId);
    if (this.adventure) {
      // Charger les personnages de l'aventure
      this.adventureCharacters = [];
      for (const charRef of this.adventure.characters) {
        const characters = this.storageService.getCharacters(charRef.userId);
        const character = characters.find(c => c.id === charRef.characterId);
        if (character) {
          const users = this.storageService.getUsers();
          const user = users.find(u => u.id === charRef.userId);
          this.adventureCharacters.push({
            character,
            userName: user ? user.username : 'Inconnu'
          });
        }
      }
    }
  }

  onBackToAdventure() {
    if (this.adventureId) {
      this.router.navigate(['/adventure-game', this.adventureId]);
    } else {
      // Retour au dashboard si pas d'aventure
      this.router.navigate(['/dashboard']);
    }
  }

  selectAdventureCharacter(charInfo: AdventureCharacterInfo) {
    // Préremplir le formulaire avec les données du personnage
    const hpItem = charInfo.character.dataItems.find((item: any) => item.type === 'hp');
    const acItem = charInfo.character.dataItems.find((item: any) => 
      item.metadata?.dnd5eType === 'armor-class' || item.type === 'armor_class'
    );

    this.newParticipant.name = charInfo.character.name;
    this.newParticipant.isPlayer = true;
    this.newParticipant.hp = hpItem?.metadata?.['maxHp'] || hpItem?.metadata?.['currentHp'] || 10;
    this.newParticipant.maxHp = hpItem?.metadata?.['maxHp'] || 10;
    this.newParticipant.ac = acItem?.value as number || 10;
    this.newParticipant.initiative = 0; // L'utilisateur devra le renseigner
    
    this.showCharacterSelect = false;
  }

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