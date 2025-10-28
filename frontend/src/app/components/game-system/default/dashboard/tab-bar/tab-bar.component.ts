import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardTab } from '../../../../../models/rpg.models';

@Component({
  selector: 'app-tab-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-bar.component.html',
  styleUrl: './tab-bar.component.scss'
})
export class TabBarComponent {
  @Input() tabs: DashboardTab[] = [];
  @Input() activeTabId: string | null = null;
  @Input() canAddTab = true; // Limité à 8 onglets
  
  @Output() tabSelected = new EventEmitter<string>();
  @Output() tabAdd = new EventEmitter<void>();
  @Output() tabEdit = new EventEmitter<string>();
  @Output() tabDelete = new EventEmitter<string>();
  @Output() tabDropped = new EventEmitter<string>(); // Nouvel événement pour le drop
  @Output() elementAdd = new EventEmitter<void>(); // Nouvel événement pour ajouter un élément
  
  dragOverTabId: string | null = null;

  onTabClick(tabId: string): void {
    this.tabSelected.emit(tabId);
  }

  onAddTab(): void {
    if (this.canAddTab) {
      this.tabAdd.emit();
    }
  }

  onAddElement(): void {
    this.elementAdd.emit();
  }

  onEditTab(event: Event, tabId: string): void {
    event.stopPropagation(); // Empêcher la sélection de l'onglet
    this.tabEdit.emit(tabId);
  }

  onDeleteTab(event: Event, tabId: string): void {
    event.stopPropagation(); // Empêcher la sélection de l'onglet
    if (confirm('Êtes-vous sûr de vouloir supprimer cet onglet ? (seulement possible s\'il est vide)')) {
      this.tabDelete.emit(tabId);
    }
  }

  // Gestion du drag-and-drop
  onDragOver(event: DragEvent, tabId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverTabId = tabId;
  }

  onDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    
    // Vérifier si on quitte vraiment l'onglet (pas juste un enfant)
    if (!target.contains(relatedTarget)) {
      this.dragOverTabId = null;
    }
  }

  onDrop(event: DragEvent, tabId: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverTabId = null;
    
    // Émettre l'événement de drop avec l'ID de l'onglet cible
    this.tabDropped.emit(tabId);
  }
}
