import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserMode } from '../../models/rpg.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  selectedMode = UserMode.PLAYER;
  isLoading = false;
  userModes = UserMode;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

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
}