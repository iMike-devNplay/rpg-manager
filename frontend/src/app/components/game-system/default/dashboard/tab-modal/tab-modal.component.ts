import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardTab, TabIcon, TAB_ICONS, TAB_ICON_LABELS } from '../../../../../models/rpg.models';

@Component({
  selector: 'app-tab-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tab-modal.component.html',
  styleUrl: './tab-modal.component.scss'
})
export class TabModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() editingTab: DashboardTab | null = null;
  
  @Output() save = new EventEmitter<{ name: string; icon: TabIcon }>();
  @Output() close = new EventEmitter<void>();

  tabName = '';
  selectedIcon: TabIcon = '📊';
  availableIcons = TAB_ICONS;
  iconLabels = TAB_ICON_LABELS;

  ngOnInit() {
    if (this.editingTab) {
      this.tabName = this.editingTab.name;
      this.selectedIcon = this.editingTab.icon;
    }
  }

  ngOnChanges() {
    if (this.editingTab) {
      this.tabName = this.editingTab.name;
      this.selectedIcon = this.editingTab.icon;
    } else {
      this.tabName = '';
      this.selectedIcon = '📊';
    }
  }

  onIconSelect(icon: TabIcon): void {
    this.selectedIcon = icon;
  }

  onSave(): void {
    if (!this.tabName.trim()) {
      alert('Veuillez saisir un nom pour l\'onglet');
      return;
    }

    this.save.emit({
      name: this.tabName.trim(),
      icon: this.selectedIcon
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }
}
