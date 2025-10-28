import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataItem } from '../../../../models/rpg.models';
import { StorageService } from '../../../../services/storage.service';

@Component({
  selector: 'app-select-element',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-element.component.html',
  styleUrl: './select-element.component.scss'
})
export class SelectElementComponent implements OnInit, OnChanges {
  @Input() item!: DataItem;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  loadedOptions: { label: string; value: string }[] = [];
  private lastSelectListId: string | null = null;

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.forceReloadOptions();
    }
  }

  private forceReloadOptions(): void {
    this.lastSelectListId = null; // Forcer le rechargement
    this.loadedOptions = [];      // Vider les options
    this.loadOptions();           // Recharger
  }

  private loadOptions(): void {
    const selectListId = this.item.metadata?.['selectListId'];
    if (selectListId) {
      // Forcer le rechargement si l'ID a changé
      if (selectListId !== this.lastSelectListId) {
        this.loadedOptions = []; // Vider d'abord les options
        this.lastSelectListId = selectListId;
      }
      
      // Charger les nouvelles options si pas encore chargées
      if (this.loadedOptions.length === 0) {
        const selectList = this.storageService.getSelectListById(selectListId);
        if (selectList) {
          this.loadedOptions = selectList.options.map(opt => ({
            label: opt.label,
            value: opt.value
          }));
        }
      }
    }
  }

  get options(): { label: string; value: string }[] {
    // Charger les options si nécessaire (éviter les appels répétés)
    const currentSelectListId = this.item.metadata?.['selectListId'];
    if (currentSelectListId && currentSelectListId !== this.lastSelectListId) {
      this.loadOptions();
    }
    return this.loadedOptions;
  }

  get selectedLabel(): string {
    const option = this.options.find(opt => opt.value === this.item.value);
    return option ? option.label : this.item.value as string || 'Non défini';
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  onValueChange(newValue: string): void {
    this.isOpen = false; // Fermer le dropdown après sélection
    this.valueChange.emit(newValue);
  }
}
