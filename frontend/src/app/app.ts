import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Dnd5eService } from './services/dnd5e.service';

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

  constructor(private dnd5eService: Dnd5eService) {}

  ngOnInit(): void {
    // Charger les listes de sélection D&D 5e au démarrage
    this.dnd5eService.loadDnd5eSelectLists();
  }
}
