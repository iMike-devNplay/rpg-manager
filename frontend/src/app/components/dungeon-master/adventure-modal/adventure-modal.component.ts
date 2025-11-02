import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Adventure, GameSystem, PlayerCharacter } from '../../../models/rpg.models';
import { AdventureService } from '../../../services/adventure.service';
import { CharacterService } from '../../../services/character.service';
import { StorageService } from '../../../services/storage.service';

interface CharacterWithUser {
  character: PlayerCharacter;
  userName: string;
  selected: boolean;
}

@Component({
  selector: 'app-adventure-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adventure-modal.component.html',
  styleUrls: ['./adventure-modal.component.scss']
})
export class AdventureModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() adventure: Adventure | null = null;
  @Output() close = new EventEmitter<void>();

  // Formulaire
  name = '';
  description = '';
  imageUrl = '';
  gameSystem: GameSystem = GameSystem.DND5E;
  date: string = '';
  
  // Gestion des personnages
  availableCharacters: CharacterWithUser[] = [];
  selectedCharacterIds: Set<string> = new Set();

  // Liste des systèmes de jeu
  gameSystems = [
    { value: GameSystem.DND5E, label: 'D&D 5e' },
    { value: GameSystem.DND4E, label: 'D&D 4e' },
    { value: GameSystem.COF2E, label: 'Chroniques Oubliées Fantasy 2e' }
  ];

  constructor(
    private adventureService: AdventureService,
    private characterService: CharacterService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.loadForm();
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.loadForm();
    }
  }

  private loadForm() {
    if (this.adventure) {
      // Mode édition
      this.name = this.adventure.name;
      this.description = this.adventure.description;
      this.imageUrl = this.adventure.imageUrl || '';
      this.gameSystem = this.adventure.gameSystem;
      this.date = new Date(this.adventure.date).toISOString().split('T')[0];
      this.selectedCharacterIds = new Set(this.adventure.characters.map(c => c.characterId));
    } else {
      // Mode création
      this.name = '';
      this.description = '';
      this.imageUrl = '';
      this.gameSystem = GameSystem.DND5E;
      this.date = new Date().toISOString().split('T')[0];
      this.selectedCharacterIds = new Set();
    }
    
    this.loadAvailableCharacters();
  }

  private loadAvailableCharacters() {
    // Récupérer tous les personnages de tous les utilisateurs
    const allUsers = this.storageService.getUsers();
    const allCharacters: CharacterWithUser[] = [];

    allUsers.forEach(user => {
      const characters = this.storageService.getCharacters(user.id);
      
      // Filtrer selon le système de jeu sélectionné
      const filteredCharacters = characters.filter((char: PlayerCharacter) => char.gameSystem === this.gameSystem);
      
      filteredCharacters.forEach((character: PlayerCharacter) => {
        allCharacters.push({
          character,
          userName: user.username,
          selected: this.selectedCharacterIds.has(character.id)
        });
      });
    });

    this.availableCharacters = allCharacters.sort((a, b) => {
      // Trier par nom d'utilisateur puis nom de personnage
      if (a.userName !== b.userName) {
        return a.userName.localeCompare(b.userName);
      }
      return a.character.name.localeCompare(b.character.name);
    });
  }

  onGameSystemChange() {
    // Recharger les personnages disponibles et réinitialiser la sélection
    this.selectedCharacterIds.clear();
    this.loadAvailableCharacters();
  }

  toggleCharacterSelection(character: CharacterWithUser) {
    if (this.selectedCharacterIds.has(character.character.id)) {
      this.selectedCharacterIds.delete(character.character.id);
    } else {
      this.selectedCharacterIds.add(character.character.id);
    }
    character.selected = !character.selected;
  }

  isFormValid(): boolean {
    return this.name.trim().length > 0 &&
           this.date !== '' &&
           this.selectedCharacterIds.size > 0;
  }

  onSubmit() {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires et sélectionner au moins un personnage.');
      return;
    }

    // Préparer la liste des personnages avec leurs userId
    const characters = Array.from(this.selectedCharacterIds).map(characterId => {
      const charWithUser = this.availableCharacters.find(c => c.character.id === characterId);
      if (!charWithUser) {
        throw new Error(`Personnage ${characterId} introuvable`);
      }
      
      const user = this.storageService.getUsers().find(u => u.username === charWithUser.userName);
      if (!user) {
        throw new Error(`Utilisateur ${charWithUser.userName} introuvable`);
      }

      return {
        characterId,
        userId: user.id
      };
    });

    try {
      if (this.adventure) {
        // Mode édition
        this.adventureService.updateAdventure(this.adventure.id, {
          name: this.name,
          description: this.description,
          imageUrl: this.imageUrl || undefined,
          gameSystem: this.gameSystem,
          date: new Date(this.date),
          characters
        });
      } else {
        // Mode création
        this.adventureService.createAdventure({
          name: this.name,
          description: this.description,
          imageUrl: this.imageUrl || undefined,
          gameSystem: this.gameSystem,
          date: new Date(this.date),
          characters
        });
      }

      this.close.emit();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'aventure:', error);
      alert('Une erreur est survenue lors de la sauvegarde.');
    }
  }

  getGameSystemLabel(): string {
    const system = this.gameSystems.find(s => s.value === this.gameSystem);
    return system ? system.label : '';
  }

  onCancel() {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
