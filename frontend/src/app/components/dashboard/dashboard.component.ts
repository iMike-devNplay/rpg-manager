import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { StorageService } from '../../services/storage.service';
import { User, UserMode, DashboardZone, DataItem, DataGroup, DataType } from '../../models/rpg.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  currentView = 'dashboard';
  zones = DashboardZone;
  dataTypes = DataType;
  dataItems: DataItem[] = [];
  
  // Modal pour ajouter des éléments
  showAddModal = false;
  newItem: Partial<DataItem> = {};
  currentZone: DashboardZone = DashboardZone.CENTER;

  constructor(
    private userService: UserService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loadUserData();
      }
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
      this.loadUserData();
      this.closeAddModal();
    }
  }

  removeItem(itemId: string): void {
    if (this.currentUser) {
      this.storageService.deleteDataItem(itemId, this.currentUser.id);
      this.loadUserData();
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
            this.loadUserData();
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
}