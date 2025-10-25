import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterSelectorModalComponent } from '../character-selector-modal/character-selector-modal.component';
import { CreateCharacterModalComponent } from '../create-character-modal/create-character-modal.component';
import { CharacterService } from '../../../services/character.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-character-selection-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CharacterSelectorModalComponent, CreateCharacterModalComponent],
  template: `
    <div class="login-container character-selection-container">
      <div class="login-card">
        <h1>🎭 Sélection / Création de personnage</h1>
        <p class="subtitle">Choisissez ou créez un personnage pour commencer</p>

        <div class="selector-wrapper">
          <app-character-selector-modal
            [isVisible]="true"
            [inlineMode]="true"
            [currentCharacter]="currentCharacter"
            [userCharacters]="userCharacters"
            (characterSelected)="onSelect($event)"
            (createNewCharacter)="openCreate()"
            (duplicateCharacter)="onDuplicate($event)"
            (deleteCharacter)="onDelete($event)"
            (editCharacter)="onEdit($event)">
          </app-character-selector-modal>
        </div>

        <app-create-character-modal
          [isVisible]="showCreate"
          (close)="closeCreate()"
          (characterCreated)="onCreated($event)">
        </app-create-character-modal>

        <!-- Modale d'édition du nom de personnage -->
        <div *ngIf="showEdit" class="modal-overlay" (click)="closeEdit()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h2>Modifier le nom du personnage</h2>
            
            <form class="character-form" (ngSubmit)="saveCharacterName()">
              <div class="form-group">
                <label for="editCharacterName">Nouveau nom *</label>
                <input 
                  type="text" 
                  id="editCharacterName"
                  [(ngModel)]="editCharacterName" 
                  name="editCharacterName"
                  placeholder="Entrez le nouveau nom"
                  required
                  maxlength="50"
                  #nameInput>
              </div>
              
              <div class="modal-actions">
                <button type="button" class="btn secondary" (click)="closeEdit()">
                  Annuler
                </button>
                <button 
                  type="submit" 
                  class="btn primary" 
                  [disabled]="!editCharacterName.trim()">
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./character-selection-page.component.scss']
})
export class CharacterSelectionPageComponent {
  userCharacters: any[] = [];
  currentCharacter: any = null;
  showCreate = false;
  showEdit = false;
  editingCharacter: any = null;
  editCharacterName = '';

  constructor(private characterService: CharacterService, private router: Router) {
    this.userCharacters = this.characterService.getUserCharacters();
    this.currentCharacter = this.characterService.getCurrentCharacter();
  }

  onSelect(character: any) {
    this.characterService.setCurrentCharacter(character);
    this.router.navigate(['/dashboard']);
  }

  openCreate() {
    this.showCreate = true;
  }

  closeCreate() {
    this.showCreate = false;
    // Recharger la liste après fermeture pour être sûr d'avoir les dernières données
    console.log('=== closeCreate: rechargement de la liste ===');
    this.userCharacters = this.characterService.getUserCharacters();
    console.log('=== Nombre de personnages après rechargement:', this.userCharacters.length);
  }

  async onCreated(data: any) {
    try {
      console.log('=== Création personnage depuis character-selection ===');
      // Créer le personnage
      const newCharacter = await this.characterService.createCharacter(data.name, data.gameSystem);
      console.log('=== Personnage créé:', newCharacter.id, newCharacter.name);
      
      // Recharger la liste des personnages APRÈS la création complète
      this.userCharacters = this.characterService.getUserCharacters();
      console.log('=== Liste rechargée dans onCreated, nb personnages:', this.userCharacters.length);
    } catch (error) {
      console.error('Erreur lors de la création du personnage:', error);
      alert('Erreur lors de la création du personnage. Veuillez réessayer.');
    }
  }

  onDuplicate(character: any) {
    this.characterService.duplicateCharacter(character);
    this.userCharacters = this.characterService.getUserCharacters();
  }

  onDelete(character: any) {
    this.characterService.deleteCharacter(character.id);
    this.userCharacters = this.characterService.getUserCharacters();
  }

  onEdit(character: any) {
    this.editingCharacter = character;
    this.editCharacterName = character.name;
    this.showEdit = true;
  }

  closeEdit() {
    this.showEdit = false;
    this.editingCharacter = null;
    this.editCharacterName = '';
  }

  saveCharacterName() {
    if (this.editingCharacter && this.editCharacterName.trim()) {
      const updatedCharacter = {
        ...this.editingCharacter,
        name: this.editCharacterName.trim(),
        updatedAt: new Date()
      };
      
      this.characterService.updateCharacter(updatedCharacter);
      this.userCharacters = this.characterService.getUserCharacters();
      
      // Si c'est le personnage actuel, mettre à jour aussi
      if (this.currentCharacter?.id === updatedCharacter.id) {
        this.currentCharacter = updatedCharacter;
      }
      
      this.closeEdit();
    }
  }
}
