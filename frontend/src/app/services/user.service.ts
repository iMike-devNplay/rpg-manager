import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, UserMode } from '../models/rpg.models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private storageService: StorageService) {
    // Écouter les changements d'utilisateur depuis le StorageService
    this.storageService.currentUser$.subscribe(user => {
      this.currentUserSubject.next(user);
    });
  }

  createUser(username: string, mode: UserMode): User {
    const user: User = {
      id: this.storageService.generateId(),
      username: username.trim(),
      mode,
      createdAt: new Date()
    };

    this.storageService.setCurrentUser(user);
    return user;
  }

  loginUser(username: string, mode: UserMode): User {
    // Dans cette application, on crée simplement un nouvel utilisateur à chaque "connexion"
    // car il n'y a pas de persistance des utilisateurs entre les sessions
    return this.createUser(username, mode);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  logout(): void {
    this.storageService.clearCurrentUser();
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isGameMaster(): boolean {
    const user = this.getCurrentUser();
    return user?.mode === UserMode.GAMEMASTER;
  }

  isPlayer(): boolean {
    const user = this.getCurrentUser();
    return user?.mode === UserMode.PLAYER;
  }

  switchMode(newMode: UserMode): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        mode: newMode
      };
      this.storageService.setCurrentUser(updatedUser);
    }
  }
}