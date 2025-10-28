import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataItem, DataType, SelectListReference, SelectListsStorage } from '../../../../../../models/rpg.models';
import { StorageService } from '../../../../../../services/storage.service';

@Component({
  selector: 'app-select-element-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-element-modal.component.html',
  styleUrls: ['./select-element-modal.component.scss']
})
export class SelectElementModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingElement: DataItem | null = null; // null = création, sinon édition
  @Input() tabId = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<DataItem>>();

  formData = {
    name: '',
    value: '',
    description: '',
    selectListMode: 'existing', // 'existing' = sélectionner liste existante, 'new' = créer nouvelle liste
    selectedListId: '',
    newListName: '',
    options: [] as { label: string; value: string }[]
  };

  availableLists: SelectListReference[] = [];
  selectedListIsSystem = false;

  // Pour l'ajout d'options
  newOptionLabel = '';
  newOptionValue = '';
  
  // État de collapse pour la liste des options (fermé par défaut)
  optionsCollapsed = true;

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.loadAvailableLists();
    this.initializeForm();
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.loadAvailableLists();
      this.initializeForm();
    }
  }

  private loadAvailableLists(): void {
    const lists = this.storageService.getSelectLists();
    this.availableLists = [...lists.systemLists, ...lists.customLists];
  }

  private initializeForm(): void {
    // Initialize form data for select modal
    if (this.editingElement) {
      // Mode édition
      const selectListId = this.editingElement.metadata?.['selectListId'] || '';
      const selectList = selectListId ? this.storageService.getSelectListById(selectListId) : null;
      
      this.formData = {
        name: this.editingElement.name,
        value: this.editingElement.value as string || '',
        description: this.editingElement.description || '',
        selectListMode: 'existing',
        selectedListId: selectListId,
        newListName: '',
        options: selectList ? selectList.options.map(opt => ({ label: opt.label, value: opt.value })) : []
      };
      
      this.selectedListIsSystem = selectList?.type === 'system';
    } else {
      // Mode création
      this.formData = {
        name: '',
        value: '',
        description: '',
        selectListMode: 'existing',
        selectedListId: '',
        newListName: '',
        options: []
      };
      this.selectedListIsSystem = false;
    }
  }

  onSelectListChange(): void {
    if (this.formData.selectedListId) {
      const selectedList = this.storageService.getSelectListById(this.formData.selectedListId);
      if (selectedList) {
        this.formData.options = selectedList.options.map(opt => ({
          label: opt.label,
          value: opt.value
        }));
        this.selectedListIsSystem = selectedList.type === 'system';
      }
    } else {
      this.formData.options = [];
      this.selectedListIsSystem = false;
    }
  }

  onSelectListModeChange(): void {
    if (this.formData.selectListMode === 'new') {
      this.formData.selectedListId = '';
      this.formData.options = [];
      this.selectedListIsSystem = false;
    }
  }

  addOption(): void {
    if (this.newOptionLabel.trim() && this.newOptionValue.trim()) {
      this.formData.options.push({
        label: this.newOptionLabel.trim(),
        value: this.newOptionValue.trim()
      });
      this.newOptionLabel = '';
      this.newOptionValue = '';
    }
  }

  removeOption(index: number): void {
    this.formData.options.splice(index, 1);
  }

  onSave(): void {
    if (!this.isFormValid()) return;

    let selectListId = '';

    // Si mode "new", créer une nouvelle liste custom
    if (this.formData.selectListMode === 'new') {
      const newListId = this.storageService.generateId();
      const listToSave: SelectListReference = {
        id: newListId,
        name: this.formData.newListName.trim(),
        type: 'custom',
        options: this.formData.options.map(opt => ({
          id: this.storageService.generateId(),
          label: opt.label,
          value: opt.value
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.storageService.saveSelectList(listToSave);
      selectListId = newListId;
    } 
    // Si mode "existing" avec liste custom, sauvegarder les modifications
    else if (this.formData.selectListMode === 'existing' && !this.selectedListIsSystem && this.formData.selectedListId) {
      const listToSave: SelectListReference = {
        id: this.formData.selectedListId,
        name: this.availableLists.find(l => l.id === this.formData.selectedListId)?.name || '',
        type: 'custom',
        options: this.formData.options.map(opt => ({
          id: this.storageService.generateId(),
          label: opt.label,
          value: opt.value
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.storageService.saveSelectList(listToSave);
      selectListId = this.formData.selectedListId;
    }
    // Si mode "existing" avec liste système ou custom non modifiée, utiliser l'ID existant
    else {
      selectListId = this.formData.selectedListId;
    }

    const elementData: Partial<DataItem> = {
      type: DataType.SELECT,
      name: this.formData.name.trim(),
      value: this.formData.value.trim(),
      description: this.formData.description.trim() || undefined,
      tabId: this.tabId,
      metadata: {
        selectListId: selectListId
      }
    };

    if (this.editingElement) {
      elementData.id = this.editingElement.id;
    }

    this.save.emit(elementData);
    this.onClose();
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  isFormValid(): boolean {
    const hasName = this.formData.name.trim().length > 0;
    const hasOptions = this.formData.options.length > 0;
    
    if (this.formData.selectListMode === 'existing') {
      return hasName && this.formData.selectedListId.length > 0 && hasOptions;
    } else {
      return hasName && this.formData.newListName.trim().length > 0 && hasOptions;
    }
  }

  get canEditOptions(): boolean {
    return this.formData.selectListMode === 'new' || !this.selectedListIsSystem;
  }
}
