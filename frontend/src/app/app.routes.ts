import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/game-system/default/dashboard/dashboard.component';
import { CharacterSelectionPageComponent } from './components/character-management/character-selection-page/character-selection-page.component';
import { AdventuresListComponent } from './components/dungeon-master/adventures-list/adventures-list.component';
import { AdventureGameComponent } from './components/dungeon-master/adventure-game/adventure-game.component';
import { CombatManagementComponent } from './components/dungeon-master/combat-management/combat-management.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'character', component: CharacterSelectionPageComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'adventures', component: AdventuresListComponent, canActivate: [authGuard] },
  { path: 'adventure-game/:id', component: AdventureGameComponent, canActivate: [authGuard] },
  { path: 'combat', component: CombatManagementComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
