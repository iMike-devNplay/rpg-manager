import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Adventure } from '../../../models/rpg.models';
import { AdventureService } from '../../../services/adventure.service';
import { AdventureModalComponent } from '../adventure-modal/adventure-modal.component';

@Component({
  selector: 'app-adventures-list',
  standalone: true,
  imports: [CommonModule, AdventureModalComponent],
  templateUrl: './adventures-list.component.html',
  styleUrls: ['./adventures-list.component.scss']
})
export class AdventuresListComponent implements OnInit {
  adventures: Adventure[] = [];
  showCreateModal = false;
  editingAdventure: Adventure | null = null;

  constructor(
    private adventureService: AdventureService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAdventures();
  }

  loadAdventures() {
    this.adventures = this.adventureService.getAdventures();
  }

  onCreateAdventure() {
    this.editingAdventure = null;
    this.showCreateModal = true;
  }

  onEditAdventure(adventure: Adventure) {
    this.editingAdventure = adventure;
    this.showCreateModal = true;
  }

  onBack() {
    this.router.navigate(['/dashboard']);
  }

  onDeleteAdventure(adventure: Adventure) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'aventure "${adventure.name}" ?`)) {
      this.adventureService.deleteAdventure(adventure.id);
      this.loadAdventures();
    }
  }

  onLaunchAdventure(adventure: Adventure) {
    this.router.navigate(['/adventure-game', adventure.id]);
  }

  onModalClose() {
    this.showCreateModal = false;
    this.editingAdventure = null;
    this.loadAdventures();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getGameSystemLabel(system: string): string {
    const labels: Record<string, string> = {
      'dnd5e': 'D&D 5e',
      'dnd4e': 'D&D 4e',
      'cof2e': 'Chroniques Oubliées Fantasy 2e',
      'pathfinder': 'Pathfinder',
      'call_of_cthulhu': 'L\'Appel de Cthulhu',
      'vampire': 'Vampire : La Mascarade',
      'shadowrun': 'Shadowrun',
      'cyberpunk': 'Cyberpunk'
    };
    return labels[system] || system;
  }
}
