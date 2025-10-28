import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class SelectElementComponent implements OnInit {
  @Input() item!: DataItem;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  loadedOptions: { label: string; value: string }[] = [];

  constructor(private storageService: StorageService) {}

  ngOnInit(): void {
    this.loadOptions();
  }

  private loadOptions(): void {
    const selectListId = this.item.metadata?.['selectListId'];
    if (selectListId) {
      const selectList = this.storageService.getSelectListById(selectListId);
      if (selectList) {
        this.loadedOptions = selectList.options.map(opt => ({
          label: opt.label,
          value: opt.value
        }));
      }
    }
  }

  get options(): { label: string; value: string }[] {
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
