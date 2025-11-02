import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dnd5eService } from './services/dnd5e.service';
import { Dnd4eService } from './services/dnd4e.service';
import { Cof2eService } from './services/cof2e.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = 'RPG Manager';

  constructor(
    private dnd5eService: Dnd5eService,
    private dnd4eService: Dnd4eService,
    private cof2eService: Cof2eService
  ) {}

  ngOnInit(): void {
    // Charger les listes de sélection de tous les systèmes au démarrage
    // IMPORTANT: Attendre que toutes les listes soient chargées avant de continuer
    Promise.all([
      this.dnd5eService.loadDnd5eSelectLists(),
      this.dnd4eService.loadDnd4eSelectLists(),
      this.cof2eService.loadCof2eSelectLists()
    ]).then(() => {}).catch(error => {
      console.error('[APP] Erreur lors du chargement des listes système:', error);
    });
  }
}
