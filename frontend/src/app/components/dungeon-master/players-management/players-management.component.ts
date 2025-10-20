import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlayerCharacter, User } from '../../../models/rpg.models';
import { StorageService } from '../../../services/storage.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-players-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './players-management.component.html',
  styleUrls: ['./players-management.component.scss']
})
export class PlayersManagementComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  selectedUserCharacters: PlayerCharacter[] = [];
  selectedCharacter: PlayerCharacter | null = null;

  constructor(
    private storageService: StorageService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.users = this.storageService.getUsers();
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.selectedUserCharacters = this.storageService.getUserCharacters(user.username);
    this.selectedCharacter = null;
  }

  selectCharacter(character: PlayerCharacter) {
    this.selectedCharacter = character;
  }

  getCharacterData(character: PlayerCharacter) {
    return this.storageService.getCharacterData(character.id);
  }

  getDataGroupEntries(character: PlayerCharacter): Array<{key: string, value: any}> {
    const data = this.getCharacterData(character);
    return Object.entries(data.dataGroups).map(([key, value]) => ({key, value}));
  }

  getCurrentUser(): User | null {
    return this.userService.getCurrentUser();
  }

  exportUserData(user: User) {
    const userData = {
      user: user,
      characters: this.storageService.getUserCharacters(user.username),
      characterData: {} as any
    };

    // Exporter les données de tous les personnages de l'utilisateur
    userData.characters.forEach((character: PlayerCharacter) => {
      userData.characterData[character.id] = this.storageService.getCharacterData(character.id);
    });

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rpg-data-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUserCharacters(username: string): PlayerCharacter[] {
    return this.storageService.getUserCharacters(username);
  }

  getDataItemsCount(characterId: string): number {
    const data = this.storageService.getCharacterData(characterId);
    return Object.values(data.dataGroups).reduce((total: number, group: any) => {
      return total + group.items.length;
    }, 0);
  }

  getTotalDataItems(): number {
    return this.selectedUserCharacters.reduce((total, char) => {
      return total + this.getDataItemsCount(char.id);
    }, 0);
  }

  switchToUser(user: User) {
    if (confirm(`Voulez-vous vraiment basculer vers l'utilisateur "${user.username}" ?`)) {
      this.userService.loginUser(user.username, user.mode);
      // Le composant parent devra gérer la navigation
    }
  }
}