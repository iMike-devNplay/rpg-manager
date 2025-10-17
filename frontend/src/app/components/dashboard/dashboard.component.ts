import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { CharacterService } from '../../services/character.service';
import { CharacterSelectorModalComponent } from '../character-selector-modal/character-selector-modal.component';
import { CreateCharacterModalComponent } from '../create-character-modal/create-character-modal.component';
import { EditCharacterModalComponent } from '../edit-character-modal/edit-character-modal';
import { ElementCreationOrchestratorComponent } from '../modals/element-creation-orchestrator/element-creation-orchestrator.component';
import { ElementDisplayComponent } from '../elements/element-display/element-display.component';
import { CombatManagementComponent } from '../combat-management/combat-management.component';
import { PlayersManagementComponent } from '../players-management/players-management.component';
import { User, UserMode, DashboardZone, DataItem, DataGroup, DataType, PlayerCharacter, GameSystem, GAME_SYSTEM_LABELS } from '../../models/rpg.models';
import { Element, GameSystem as ElementGameSystem } from '../../models/element-types';
import { ElementService } from '../../services/element.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    CharacterSelectorModalComponent,
    CreateCharacterModalComponent,
    EditCharacterModalComponent,
    ElementCreationOrchestratorComponent,
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
  showEditCharacterModal = false;
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
    return this.dataItems
      .filter(item => item.zone === zone)
      .sort((a, b) => a.order - b.order);
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

  onElementCreated(elementData: Partial<Element>): void {
    try {
      if (elementData.id) {
        // Mode édition : mettre à jour l'élément existant
        // Conversion vers DataItem pour compatibilité avec le système existant
        const updatedElement = this.convertElementToDataItem(elementData as Element);
        this.storageService.saveDataItem(updatedElement);
      } else {
        // Mode création : créer un nouvel élément avec l'ordre correct
        const existingItems = this.currentCharacter?.dataItems || [];
        const newDataItem = this.convertElementToDataItem({
          ...elementData,
          id: this.generateId(),
          position: this.getNextPosition(existingItems, elementData.zone!)
        } as Element);
        this.storageService.saveDataItem(newDataItem);
      }
      
      // Recharger les données du personnage
      this.currentCharacter = this.characterService.getCurrentCharacter();
      this.closeCreateElementModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'élément:', error);
      alert('Erreur lors de la sauvegarde de l\'élément. Veuillez réessayer.');
    }
  }

  /**
   * Conversion temporaire d'Element vers DataItem pour compatibilité
   */
  private convertElementToDataItem(element: Element): DataItem {
    // Conversion de base
    const dataItem: DataItem = {
      id: element.id,
      name: element.name,
      type: this.convertElementTypeToDataType(element.type),
      value: this.getNewElementValue(element),
      zone: element.zone as DashboardZone,
      order: element.position,
      description: element.description,
      userId: this.userService.getCurrentUser()?.username || 'user' // Ajouter l'userId requis
    };

    // Propriétés spécifiques selon le type
    if (element.type === 'numeric') {
      dataItem.allowQuickModification = element.canQuickModify ?? true;
    } else if (element.type === 'dnd-attribute') {
      dataItem.hasProficiency = element.hasProficiency;
    }

    return dataItem;
  }

  private convertElementTypeToDataType(elementType: string): DataType {
    switch (elementType) {
      case 'text': return DataType.TEXT;
      case 'numeric': return DataType.NUMERIC;
      case 'dnd-attribute': return DataType.ATTRIBUTE;
      default: return DataType.TEXT;
    }
  }

  private getNewElementValue(element: Element): any {
    switch (element.type) {
      case 'text': return element.value;
      case 'numeric': return element.value;
      case 'dnd-attribute': return element.value;
      case 'equipment': return element.name; // Nom de l'équipement comme valeur
      default: return element.name;
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private getNextPosition(items: DataItem[], zone: string): number {
    const zoneItems = items.filter(item => item.zone === zone);
    return zoneItems.length > 0 ? Math.max(...zoneItems.map(item => item.order || 0)) + 1 : 0;
  }

  /**
   * Récupère le système de jeu pour les nouveaux éléments
   */
  getGameSystemForNewElement(): ElementGameSystem | null {
    const currentSystem = this.currentCharacter?.gameSystem;
    if (!currentSystem) return null;
    
    // Conversion entre les types GameSystem
    return currentSystem as ElementGameSystem;
  }

  /**
   * Convertit l'élément en cours d'édition vers le nouveau format pour compatibilité
   */
  getEditingElementForNewSystem(): Element | null {
    if (!this.editingItem) return null;

    // Conversion de DataItem vers Element
    const gameSystem = this.currentCharacter?.gameSystem as ElementGameSystem;
    const baseElement = {
      id: this.editingItem.id,
      name: this.editingItem.name,
      description: this.editingItem.description,
      zone: this.editingItem.zone,
      position: this.editingItem.order || 0,
      gameSystem
    };

    // Conversion selon le type
    switch (this.editingItem.type) {
      case DataType.TEXT:
        return {
          ...baseElement,
          type: 'text' as const,
          value: this.editingItem.value as string
        };
      case DataType.NUMERIC:
        return {
          ...baseElement,
          type: 'numeric' as const,
          value: this.editingItem.value as number,
          canQuickModify: this.editingItem.allowQuickModification !== false
        };
      case DataType.ATTRIBUTE:
        return {
          ...baseElement,
          type: 'dnd-attribute' as const,
          value: this.editingItem.value as number,
          hasProficiency: this.editingItem.hasProficiency || false
        };
      default:
        return {
          ...baseElement,
          type: 'text' as const,
          value: String(this.editingItem.value)
        };
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

  openEditCharacterModal(): void {
    this.showEditCharacterModal = true;
  }

  closeEditCharacterModal(): void {
    this.showEditCharacterModal = false;
  }

  updateCharacterInfo(data: {name: string, gameSystem: GameSystem}): void {
    console.log('Updating character with data:', data);
    if (!this.currentCharacter) {
      console.error('No current character to update');
      return;
    }

    try {
      const updatedCharacter: PlayerCharacter = {
        ...this.currentCharacter,
        name: data.name,
        gameSystem: data.gameSystem,
        updatedAt: new Date()
      };

      console.log('Calling characterService.updateCharacter with:', updatedCharacter);
      this.characterService.updateCharacter(updatedCharacter);
      this.currentCharacter = updatedCharacter;
      this.closeEditCharacterModal();
      console.log('Character updated successfully');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du personnage:', error);
    }
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

    // Si l'élément est déjà dans la même zone, l'ajouter à la fin
    if (this.draggedItem.zone === targetZone) {
      // Calculer le nouvel ordre (à la fin de la zone)
      const itemsInZone = this.currentCharacter.dataItems
        .filter(item => item.zone === targetZone && item.id !== this.draggedItem!.id)
        .sort((a, b) => a.order - b.order);
      
      const maxOrder = itemsInZone.length > 0 ? Math.max(...itemsInZone.map(item => item.order)) : -1;
      
      const updatedItem: DataItem = {
        ...this.draggedItem,
        order: maxOrder + 1
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
      return;
    }

    // Calculer le nouvel ordre pour la zone de destination
    const itemsInTargetZone = this.currentCharacter.dataItems
      .filter(item => item.zone === targetZone)
      .sort((a, b) => a.order - b.order);
    
    const maxOrder = itemsInTargetZone.length > 0 ? Math.max(...itemsInTargetZone.map(item => item.order)) : -1;

    // Créer une copie de l'élément avec la nouvelle zone et le bon ordre
    const updatedItem: DataItem = {
      ...this.draggedItem,
      zone: targetZone,
      order: maxOrder + 1
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

  /**
   * Gestion du drop d'un élément sur un autre élément (réordonnancement)
   */
  onItemDroppedOn(event: {draggedItemId: string, targetItem: DataItem}): void {
    if (!this.currentCharacter) {
      return;
    }

    const { draggedItemId, targetItem } = event;
    
    // Trouver l'élément dragué
    const draggedItem = this.currentCharacter.dataItems.find(item => item.id === draggedItemId);
    
    if (!draggedItem || draggedItem.zone !== targetItem.zone) {
      // Si l'élément dragué n'est pas dans la même zone, ne pas faire de réordonnancement
      return;
    }

    // Calculer les nouveaux ordres
    const itemsInZone = this.currentCharacter.dataItems
      .filter(item => item.zone === targetItem.zone)
      .sort((a, b) => a.order - b.order);

    const draggedIndex = itemsInZone.findIndex(item => item.id === draggedItemId);
    const targetIndex = itemsInZone.findIndex(item => item.id === targetItem.id);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      return;
    }

    // Retirer l'élément dragué de sa position actuelle
    const [movedItem] = itemsInZone.splice(draggedIndex, 1);
    
    // L'insérer à la nouvelle position (après l'élément cible)
    itemsInZone.splice(targetIndex, 0, movedItem);

    // Recalculer les ordres
    itemsInZone.forEach((item, index) => {
      item.order = index;
    });

    // Créer le personnage mis à jour
    const updatedCharacter = {
      ...this.currentCharacter,
      dataItems: this.currentCharacter.dataItems.map(item => {
        const reorderedItem = itemsInZone.find(reordered => reordered.id === item.id);
        return reorderedItem || item;
      })
    };

    // Sauvegarder les modifications
    this.characterService.updateCharacter(updatedCharacter);
    
    // Mettre à jour le personnage courant
    this.currentCharacter = updatedCharacter;
    this.dataItems = updatedCharacter.dataItems;
  }
}