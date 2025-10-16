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
import { ElementDisplayComponent } from '../elements/element-display/element-display.component';
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
    ElementDisplayComponent,
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
  editingItem: DataItem | null = null;
  
  // Drag and drop
  draggedItem: DataItem | null = null;

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
    this.editingItem = null; // Réinitialiser l'élément en édition
  }

  onElementCreated(elementData: ElementCreationData): void {
    try {
      if (elementData.id) {
        // Mode édition : mettre à jour l'élément existant
        const updatedElement = this.elementService.updateElement(elementData);
        this.storageService.saveDataItem(updatedElement);
      } else {
        // Mode création : créer un nouvel élément
        const newElement = this.elementService.createElement(elementData);
        this.storageService.saveDataItem(newElement);
      }
      
      // Recharger les données du personnage
      this.currentCharacter = this.characterService.getCurrentCharacter();
      this.closeCreateElementModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'élément:', error);
      alert('Erreur lors de la sauvegarde de l\'élément. Veuillez réessayer.');
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
      // Recharger les données du personnage courant
      this.currentCharacter = this.characterService.getCurrentCharacter();
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

  /**
   * Gestionnaire de mise à jour d'élément
   */
  onItemUpdated(item: DataItem): void {
    // L'élément a déjà été sauvegardé par le service
    // On peut optionnellement faire une mise à jour locale ici
    this.currentCharacter = this.characterService.getCurrentCharacter();
  }

  /**
   * Gestionnaire de suppression d'élément
   */
  onItemDeleted(item: DataItem): void {
    this.removeItem(item.id);
  }

  /**
   * Gestionnaire d'édition d'élément
   */
  onItemEdit(item: DataItem): void {
    // Ouvrir la modal de modification de l'élément
    this.showCreateElementModal = true;
    this.currentZone = item.zone;
    this.editingItem = item;
  }

  /**
   * Gestion du début de drag d'un élément
   */
  onItemDragStart(item: DataItem): void {
    this.draggedItem = item;
  }

  /**
   * Gestion de la fin de drag d'un élément
   */
  onItemDragEnd(): void {
    this.draggedItem = null;
    // Retirer les classes de drop des zones
    document.querySelectorAll('.zone-content').forEach(zone => {
      zone.classList.remove('drag-over');
    });
  }

  /**
   * Gestion du dragover sur une zone
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Nécessaire pour permettre le drop
    
    // Ajouter une classe CSS pour l'effet visuel
    const target = event.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  /**
   * Gestion du drop sur une zone
   */
  onDrop(event: DragEvent, targetZone: DashboardZone): void {
    event.preventDefault();
    
    // Retirer la classe CSS de drop
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
    
    // Récupérer l'ID de l'élément depuis le dataTransfer
    const itemId = event.dataTransfer?.getData('text/plain');
    
    if (!itemId || !this.draggedItem || !this.currentCharacter) {
      return;
    }

    // Vérifier que l'élément dragué correspond à l'ID récupéré
    if (this.draggedItem.id !== itemId) {
      return;
    }

    // Si l'élément est déjà dans la même zone, ne rien faire
    if (this.draggedItem.zone === targetZone) {
      return;
    }

    // Créer une copie de l'élément avec la nouvelle zone
    const updatedItem: DataItem = {
      ...this.draggedItem,
      zone: targetZone
    };

    // Mettre à jour l'élément dans les données du personnage
    const updatedCharacter = {
      ...this.currentCharacter,
      dataItems: this.currentCharacter.dataItems.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      )
    };

    // Sauvegarder les modifications
    this.characterService.updateCharacter(updatedCharacter);
    
    // Mettre à jour le personnage courant
    this.currentCharacter = updatedCharacter;
    this.dataItems = updatedCharacter.dataItems;

    // Réinitialiser le drag
    this.draggedItem = null;
  }
}