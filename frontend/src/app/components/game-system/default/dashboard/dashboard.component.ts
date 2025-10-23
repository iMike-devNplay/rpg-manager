import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { Subscription } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';
import { CharacterService } from '../../../../services/character.service';
import { Dnd5eService } from '../../../../services/dnd5e.service';
import { ElementCreationOrchestratorComponent } from '../elements/element-creation-orchestrator/element-creation-orchestrator.component';
import { ElementDisplayComponent } from '../elements/element-display/element-display.component';
import { CombatManagementComponent } from '../../../dungeon-master/combat-management/combat-management.component';
import { PlayersManagementComponent } from '../../../dungeon-master/players-management/players-management.component';
import { Dnd5eDashboardComponent } from '../../dnd5e/dnd5e-dashboard/dnd5e-dashboard.component';
import { User, UserMode, DashboardZone, DataItem, DataType, PlayerCharacter, GameSystem, GAME_SYSTEM_LABELS } from '../../../../models/rpg.models';
import { Element, GameSystem as ElementGameSystem } from '../../../../models/element-types';
import { ElementService } from '../../../../services/element.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ElementCreationOrchestratorComponent,
    ElementDisplayComponent,
    CombatManagementComponent,
    PlayersManagementComponent,
    Dnd5eDashboardComponent
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
  editingElementConverted: Element | null = null; // Cache pour éviter les reconversions
  
  // Drag and drop
  draggedItem: DataItem | null = null;

  constructor(
    private userService: UserService,
    private storageService: StorageService,
    public characterService: CharacterService,
    private elementService: ElementService,
    private dnd5eService: Dnd5eService,
    private router: Router
  ) {}

  navigateToCharacterPage(): void {
    this.router.navigate(['/character']);
  }

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Show character selector right after login
    const sub = this.userService.justLoggedIn$.subscribe(flag => {
      if (flag) {
        // Rediriger vers la page de sélection de personnage
        this.router.navigate(['/character']);
        // reset the flag so it doesn't reopen repeatedly
        this.userService.clearJustLoggedInFlag();
      }
    });
    this.subscriptions.push(sub);

    this.characterService.currentCharacter$.subscribe(character => {
      this.currentCharacter = character;
      this.loadCharacterData();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
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

  private loadCharacterData(): void {
    console.log('=== loadCharacterData début ===');
    if (this.currentCharacter) {
      console.log('=== Personnage actuel trouvé:', this.currentCharacter.name);
      this.dataItems = this.currentCharacter.dataItems || [];
      console.log('=== Nombre d\'éléments chargés:', this.dataItems.length);
    } else {
      console.log('=== Aucun personnage actuel ===');
      this.dataItems = [];
    }
    console.log('=== loadCharacterData terminé ===');
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

  isDnd5eCharacter(): boolean {
    return this.currentCharacter?.gameSystem === GameSystem.DND5E;
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
    this.editingElementConverted = null; // Nettoyer le cache
  }

  onElementCreated(elementData: Partial<Element>): void {
    console.log('DEBUG: onElementCreated called with:', elementData);
    console.log('DEBUG: currentCharacter:', this.currentCharacter);
    console.log('DEBUG: storageService.getCurrentCharacter():', this.storageService.getCurrentCharacter());
    
    try {
      if (elementData.id) {
        // Mode édition : mettre à jour l'élément existant
        // Conversion vers DataItem pour compatibilité avec le système existant
        const updatedElement = this.convertElementToDataItem(elementData as Element);
        console.log('DEBUG: Editing element:', updatedElement);
        this.storageService.saveDataItem(updatedElement);
      } else {
        // Mode création : créer un nouvel élément avec l'ordre correct
        const currentCharacter = this.characterService.getCurrentCharacter();
        const existingItems = currentCharacter?.dataItems || [];
        const newDataItem = this.convertElementToDataItem({
          ...elementData,
          id: this.generateId(),
          position: this.getNextPosition(existingItems, elementData.zone!)
        } as Element);
        console.log('DEBUG: Creating new element:', newDataItem);
        this.storageService.saveDataItem(newDataItem);
      }
      
      // Recharger les données du personnage
      const updatedCharacter = this.characterService.getCurrentCharacter();
      if (updatedCharacter) {
        this.currentCharacter = updatedCharacter;
        this.loadCharacterData();
      }
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
    } else if (element.type === 'dnd-attributes-group') {
      // Stocker les attributs comme metadata pour préserver la structure
      dataItem.metadata = {
        dnd5eType: 'attributes-group',
        attributes: element.attributes
      };
    } else if (element.type === 'dnd-proficiency-bonus') {
      // Stocker le niveau comme metadata
      dataItem.metadata = {
        dnd5eType: 'dnd-proficiency-bonus',
        level: element.level || 1
      };
    } else if (element.type === 'dnd-skills-group') {
      // Stocker les compétences comme metadata pour préserver la structure
      dataItem.metadata = {
        dnd5eType: 'dnd-skills-group',
        skills: element.skills
      };
    }

    return dataItem;
  }

  private convertElementTypeToDataType(elementType: string): DataType {
    switch (elementType) {
      case 'text': return DataType.TEXT;
      case 'numeric': return DataType.NUMERIC;
      case 'dnd-attribute': return DataType.ATTRIBUTE;
      case 'dnd-attributes-group': return DataType.ATTRIBUTES_GROUP;
      case 'dnd-proficiency-bonus': return DataType.DND_PROFICIENCY_BONUS;
      case 'dnd-level': return DataType.DND_LEVEL;
      case 'dnd-skills-group': return DataType.DND_SKILLS_GROUP;
      default: return DataType.TEXT;
    }
  }

  private getNewElementValue(element: Element): any {
    switch (element.type) {
      case 'text': return element.value;
      case 'numeric': return element.value;
      case 'dnd-attribute': return element.value;
      case 'dnd-attributes-group': return 'Attributs'; // Nom générique pour l'affichage
      case 'dnd-proficiency-bonus': return element.value;
      case 'dnd-level': return element.level;
      case 'dnd-skills-group': return 'Compétences'; // Nom générique pour l'affichage
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
    return this.editingElementConverted;
  }

  /**
   * Convertit un DataItem vers un Element pour la modal
   */
  private convertDataItemToElement(item: DataItem): Element | null {
    console.log('DEBUG: convertDataItemToElement called with item:', item);
    
    if (!item) return null;

    // Conversion de DataItem vers Element
    const gameSystem = this.currentCharacter?.gameSystem as ElementGameSystem;
    const baseElement = {
      id: item.id,
      name: item.name,
      description: item.description,
      zone: item.zone,
      position: item.order || 0,
      gameSystem
    };

    // Conversion selon le type
    switch (item.type) {
      case DataType.TEXT:
        const textElement = {
          ...baseElement,
          type: 'text' as const,
          value: item.value as string
        };
        console.log('DEBUG: convertDataItemToElement returning (text):', textElement);
        return textElement;
      case DataType.NUMERIC:
        const numericElement = {
          ...baseElement,
          type: 'numeric' as const,
          value: item.value as number,
          canQuickModify: item.allowQuickModification !== false
        };
        console.log('DEBUG: convertDataItemToElement returning (numeric):', numericElement);
        return numericElement;
      case DataType.ATTRIBUTE:
        const attributeElement = {
          ...baseElement,
          type: 'dnd-attribute' as const,
          value: item.value as number,
          hasProficiency: item.hasProficiency || false
        };
        console.log('DEBUG: convertDataItemToElement returning (attribute):', attributeElement);
        return attributeElement;
      case DataType.ATTRIBUTES_GROUP:
        const attributesGroupElement = {
          ...baseElement,
          type: 'dnd-attributes-group' as const,
          attributes: item.metadata?.['attributes'] || {
            strength: { value: 10, hasProficiency: false },
            dexterity: { value: 10, hasProficiency: false },
            constitution: { value: 10, hasProficiency: false },
            intelligence: { value: 10, hasProficiency: false },
            wisdom: { value: 10, hasProficiency: false },
            charisma: { value: 10, hasProficiency: false }
          }
        };
        console.log('DEBUG: convertDataItemToElement returning (attributes-group):', attributesGroupElement);
        return attributesGroupElement;
      case DataType.DND_PROFICIENCY_BONUS:
        const proficiencyBonusElement = {
          ...baseElement,
          type: 'dnd-proficiency-bonus' as const,
          value: item.value as number,
          level: item.metadata?.['level'] || 1
        };
        console.log('DEBUG: convertDataItemToElement returning (dnd-proficiency-bonus):', proficiencyBonusElement);
        return proficiencyBonusElement;
      case DataType.DND_LEVEL:
        const levelElement = {
          ...baseElement,
          type: 'dnd-level' as const,
          level: item.value as number
        };
        console.log('DEBUG: convertDataItemToElement returning (dnd-level):', levelElement);
        return levelElement;
      case DataType.DND_SKILLS_GROUP:
        const skillsGroupElement = {
          ...baseElement,
          type: 'dnd-skills-group' as const,
          skills: item.metadata?.['skills'] || {
            // Compétences basées sur la Force
            athletics: { hasProficiency: false, hasExpertise: false },
            // Compétences basées sur la Dextérité
            acrobatics: { hasProficiency: false, hasExpertise: false },
            sleightOfHand: { hasProficiency: false, hasExpertise: false },
            stealth: { hasProficiency: false, hasExpertise: false },
            // Compétences basées sur l'Intelligence
            arcana: { hasProficiency: false, hasExpertise: false },
            history: { hasProficiency: false, hasExpertise: false },
            investigation: { hasProficiency: false, hasExpertise: false },
            nature: { hasProficiency: false, hasExpertise: false },
            religion: { hasProficiency: false, hasExpertise: false },
            // Compétences basées sur la Sagesse
            animalHandling: { hasProficiency: false, hasExpertise: false },
            insight: { hasProficiency: false, hasExpertise: false },
            medicine: { hasProficiency: false, hasExpertise: false },
            perception: { hasProficiency: false, hasExpertise: false },
            survival: { hasProficiency: false, hasExpertise: false },
            // Compétences basées sur le Charisme
            deception: { hasProficiency: false, hasExpertise: false },
            intimidation: { hasProficiency: false, hasExpertise: false },
            performance: { hasProficiency: false, hasExpertise: false },
            persuasion: { hasProficiency: false, hasExpertise: false }
          }
        };
        console.log('DEBUG: convertDataItemToElement returning (dnd-skills-group):', skillsGroupElement);
        return skillsGroupElement;
      default:
        const defaultElement = {
          ...baseElement,
          type: 'text' as const,
          value: String(item.value)
        };
        console.log('DEBUG: convertDataItemToElement returning (default):', defaultElement);
        return defaultElement;
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
    
    // Synchronisation automatique niveau → bonus de maîtrise pour D&D 5e
    if (this.currentCharacter && this.currentCharacter.gameSystem === 'dnd5e') {
      if (item.type === DataType.DND_LEVEL) {
        // Le niveau a changé, synchroniser le bonus de maîtrise et recalculer les valeurs dérivées
        const newLevel = item.value as number;
        this.dnd5eService.syncProficiencyBonusWithLevel(this.currentCharacter, newLevel);
        // Recalculer toutes les valeurs dérivées (jets de sauvegarde, compétences, etc.)
        this.dnd5eService.updateCalculatedValues(this.currentCharacter);
        // Recharger le personnage pour refléter les changements
        this.currentCharacter = this.characterService.getCurrentCharacter();
        // Forcer le rechargement complet de la vue pour mettre à jour tous les composants
        this.loadCharacterData();
      }
    }
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
    console.log('DEBUG: onItemEdit called with item:', item);
    // Ouvrir la modal de modification de l'élément
    this.showCreateElementModal = true;
    this.currentZone = item.zone;
    this.editingItem = item;
    
    // Convertir et mettre en cache l'élément pour la modal
    this.editingElementConverted = this.convertDataItemToElement(item);
    console.log('DEBUG: Converted element for editing:', this.editingElementConverted);
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