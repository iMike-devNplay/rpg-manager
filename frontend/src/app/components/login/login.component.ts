import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User, UserMode } from '../../models/rpg.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  selectedMode = UserMode.PLAYER;
  isLoading = false;
  userModes = UserMode;
  
  // Gestion des utilisateurs existants
  existingUsers: User[] = [];
  selectedExistingUser: User | null = null;
  showExistingUsers = true;

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    this.loadExistingUsers();
  }

  onSubmit(): void {
    if (this.username.trim().length < 2) {
      return;
    }

    this.isLoading = true;
    
    try {
      this.userService.loginUser(this.username.trim(), this.selectedMode);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private loadExistingUsers(): void {
    this.existingUsers = this.userService.getAllUsers();
  }

  onSelectExistingUser(): void {
    if (this.selectedExistingUser) {
      this.isLoading = true;
      try {
        this.userService.loginExistingUser(this.selectedExistingUser);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  deleteExistingUser(user: User, event: Event): void {
    event.stopPropagation();
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" (${this.getModeLabel(user.mode)}) ?\n\nToutes ses données seront perdues définitivement.`)) {
      this.userService.deleteUser(user.id);
      this.loadExistingUsers();
      if (this.selectedExistingUser?.id === user.id) {
        this.selectedExistingUser = null;
      }
    }
  }

  getModeLabel(mode: UserMode): string {
    return mode === UserMode.PLAYER ? 'Joueur' : 'Maître de jeu';
  }

  toggleCreateNewUser(): void {
    this.showExistingUsers = !this.showExistingUsers;
    this.selectedExistingUser = null;
  }
}