import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { CharacterService } from '../../services/character.service';
import { CharacterSelectorModalComponent } from '../character-selector-modal/character-selector-modal.component';
import { CreateCharacterModalComponent } from '../create-character-modal/create-character-modal.component';
import { CreateElementModalComponent, ElementCreationData } from '../elements/create-element-modal/create-element-modal.component';
import { CombatManagementComponent } from '../combat-management/combat-management.component';
import { PlayersManagementComponent } from '../players-management/players-management.component';
import { User, UserMode, DashboardZone, DataItem, DataGroup, DataType, PlayerCharacter, GameSystem, GAME_SYSTEM_LABELS } from '../../models/rpg.models';
import { ElementService } from '../../services/element.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CharacterSelectorModalComponent,
    CreateCharacterModalComponent,
    CreateElementModalComponent,
    CombatManagementComponent,
    PlayersManagementComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  currentCharacter: PlayerCharacter | null = null;
  userCharacters: PlayerCharacter[] = [];
  currentView = 'dashboard';
  zones = DashboardZone;
  dataTypes = DataType;
  gameSystems = GameSystem;
  gameSystemLabels = GAME_SYSTEM_LABELS;
  dataItems: DataItem[] = [];
  
  // Modal pour ajouter des éléments
  showAddModal = false;
  showCreateElementModal = false;
  newItem: Partial<DataItem> = {};
  currentZone: DashboardZone = DashboardZone.CENTER;

  // Modal pour gérer les personnages
  showCharacterModal = false;
  showCreateCharacterModal = false;
  newCharacterName = '';
  newCharacterSystem = GameSystem.OTHER;

  constructor(
    private userService: UserService,
    private storageService: StorageService,
    public characterService: CharacterService,
    private elementService: ElementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loadUserCharacters();
      }
    });

    this.characterService.currentCharacter$.subscribe(character => {
      this.currentCharacter = character;
      this.loadCharacterData();
    });
  }

  private loadUserData(): void {
    if (this.currentUser) {
      const characters = this.storageService.getCharacters(this.currentUser.id);
      if (characters.length > 0) {
        this.dataItems = characters[0].dataItems || [];
      } else {
        // Si aucun personnage n'existe, en créer un par défaut
        this.dataItems = [];
      }
    }
  }

  private loadUserCharacters(): void {
    this.userCharacters = this.characterService.getUserCharacters();
  }

  private loadCharacterData(): void {
    if (this.currentCharacter) {
      this.dataItems = this.currentCharacter.dataItems || [];
    } else {
      this.dataItems = [];
    }
  }

  getModeLabel(mode: UserMode): string {
    return mode === UserMode.PLAYER ? 'Joueur' : 'Maître de jeu';
  }

  getOtherModeLabel(): string {
    return this.currentUser?.mode === UserMode.PLAYER ? 'Mode Maître' : 'Mode Joueur';
  }

  canSwitchMode(): boolean {
    return true; // Pour l'instant, on permet toujours le changement de mode
  }

  isGameMaster(): boolean {
    return this.userService.isGameMaster();
  }

  setView(view: string): void {
    this.currentView = view;
  }

  switchMode(): void {
    const newMode = this.currentUser?.mode === UserMode.PLAYER ? UserMode.GAMEMASTER : UserMode.PLAYER;
    this.userService.switchMode(newMode);
  }

  getItemsByZone(zone: DashboardZone): DataItem[] {
    return this.dataItems.filter(item => item.zone === zone);
  }

  addItem(zone: DashboardZone): void {
    this.currentZone = zone;
    this.openCreateElementModal(zone);
  }

  // Nouvelle modale d'éléments
  openCreateElementModal(zone?: DashboardZone): void {
    this.currentZone = zone || DashboardZone.CENTER;
    this.showCreateElementModal = true;
  }

  closeCreateElementModal(): void {
    this.showCreateElementModal = false;
  }

  onElementCreated(elementData: ElementCreationData): void {
    try {
      const newElement = this.elementService.createElement(elementData);
      this.storageService.saveDataItem(newElement);
      this.loadCharacterData();
      this.closeCreateElementModal();
    } catch (error) {
      console.error('Erreur lors de la création de l\'élément:', error);
      alert('Erreur lors de la création de l\'élément. Veuillez réessayer.');
    }
  }

  // Ancienne modale (à conserver pour compatibilité)
  addItemOld(zone: DashboardZone): void {
    this.currentZone = zone;
    this.newItem = {
      name: '',
      type: DataType.TEXT,
      value: '',
      description: '',
      zone: zone
    };
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.newItem = {};
  }

  saveNewItem(): void {
    if (this.currentUser && this.newItem.name && this.newItem.value !== undefined) {
      const item: DataItem = {
        id: this.storageService.generateId(),
        name: this.newItem.name,
        type: this.newItem.type || DataType.TEXT,
        value: this.newItem.value,
        description: this.newItem.description,
        zone: this.currentZone,
        order: this.dataItems.length,
        userId: this.currentUser.id
      };

      this.storageService.saveDataItem(item);
      this.loadCharacterData();
      this.closeAddModal();
    }
  }

  removeItem(itemId: string): void {
    if (this.currentUser) {
      this.storageService.deleteDataItem(itemId, this.currentUser.id);
      this.loadCharacterData();
    }
  }

  exportData(): void {
    try {
      const exportData = this.storageService.exportData();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rpg-manager-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erreur lors de l\'export: ' + error);
    }
  }

  importData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const importData = JSON.parse(e.target.result);
            this.storageService.importData(importData);
            this.loadCharacterData();
            alert('Données importées avec succès !');
          } catch (error) {
            alert('Erreur lors de l\'import: fichier invalide');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/login']);
  }

  // Gestion des personnages
  openCharacterModal(): void {
    this.loadUserCharacters();
    this.showCharacterModal = true;
  }

  closeCharacterModal(): void {
    this.showCharacterModal = false;
  }

  selectCharacter(character: PlayerCharacter): void {
    this.characterService.setCurrentCharacter(character);
    this.closeCharacterModal();
  }

  openCreateCharacterModal(): void {
    this.newCharacterName = '';
    this.newCharacterSystem = GameSystem.OTHER;
    this.showCreateCharacterModal = true;
  }

  closeCreateCharacterModal(): void {
    this.showCreateCharacterModal = false;
  }

  createNewCharacter(data: {name: string, gameSystem: GameSystem}): void {
    try {
      this.characterService.createCharacter(data.name, data.gameSystem);
      this.loadUserCharacters();
      this.closeCreateCharacterModal();
    } catch (error) {
      console.error('Erreur lors de la création du personnage:', error);
    }
  }

  deleteCharacter(character: PlayerCharacter): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le personnage "${character.name}" ?\n\nToutes ses données seront perdues définitivement.`)) {
      this.characterService.deleteCharacter(character.id);
      this.loadUserCharacters();
    }
  }

  duplicateCharacter(character: PlayerCharacter): void {
    try {
      this.characterService.duplicateCharacter(character);
      this.loadUserCharacters();
    } catch (error) {
      console.error('Erreur lors de la duplication du personnage:', error);
    }
  }

  getGameSystemLabel(gameSystem: GameSystem): string {
    return this.characterService.getGameSystemLabel(gameSystem);
  }

  // Méthodes pour les nouveaux éléments
  getElementValue(item: DataItem): string {
    return this.elementService.formatElementValue(item);
  }

  getElementTypeLabel(item: DataItem): string {
    return this.elementService.getElementTypeLabel(item.type);
  }

  isAttributeElement(item: DataItem): boolean {
    return item.type === DataType.ATTRIBUTE;
  }

  isProficiencyBonusElement(item: DataItem): boolean {
    return item.type === DataType.PROFICIENCY_BONUS;
  }
}