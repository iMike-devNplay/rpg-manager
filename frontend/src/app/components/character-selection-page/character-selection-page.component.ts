import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterSelectorModalComponent } from '../character-selector-modal/character-selector-modal.component';
import { CreateCharacterModalComponent } from '../create-character-modal/create-character-modal.component';
import { CharacterService } from '../../services/character.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-character-selection-page',
  standalone: true,
  imports: [CommonModule, CharacterSelectorModalComponent, CreateCharacterModalComponent],
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
            (deleteCharacter)="onDelete($event)">
          </app-character-selector-modal>
        </div>

        <app-create-character-modal
          [isVisible]="showCreate"
          (close)="closeCreate()"
          (characterCreated)="onCreated($event)">
        </app-create-character-modal>
      </div>
    </div>
  `,
  styleUrls: ['./character-selection-page.component.scss']
})
export class CharacterSelectionPageComponent {
  userCharacters: any[] = [];
  currentCharacter: any = null;
  showCreate = false;

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
  }

  onCreated(data: any) {
    // assume createCharacter handles persistence
    this.characterService.createCharacter(data.name, data.gameSystem);
    this.userCharacters = this.characterService.getUserCharacters();
    this.showCreate = false;
  }

  onDuplicate(character: any) {
    this.characterService.duplicateCharacter(character);
    this.userCharacters = this.characterService.getUserCharacters();
  }

  onDelete(character: any) {
    this.characterService.deleteCharacter(character.id);
    this.userCharacters = this.characterService.getUserCharacters();
  }
}
