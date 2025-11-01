import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataItem } from '../../../../../models/rpg.models';

interface Cof2eCapacite {
  capacite: string;
  rang: number;
  name: string;
  description: string;
  acquired: boolean; // Si la capacité a été acquise
}

interface Cof2eVoie {
  voie: string;
  name: string;
  capacites: Cof2eCapacite[];
  source: 'peuple' | 'profil'; // D'où vient la voie
}

@Component({
  selector: 'app-cof2e-voies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cof2e-voies.component.html',
  styleUrl: './cof2e-voies.component.scss'
})
export class Cof2eVoiesComponent implements OnInit {
  @Input() element!: DataItem;

  voies: Cof2eVoie[] = [];

  ngOnInit(): void {
    this.loadVoiesFromElement();
  }

  /**
   * Charge les voies depuis l'élément
   */
  private loadVoiesFromElement(): void {
    if (this.element?.metadata?.['voies']) {
      this.voies = this.element.metadata['voies'];
    }
  }

  /**
   * Compte le nombre de capacités acquises dans une voie
   */
  getAcquiredCapacitiesCount(voie: Cof2eVoie): number {
    return voie.capacites.filter(c => c.acquired).length;
  }

  /**
   * Obtient le badge source (Peuple ou Profil)
   */
  getSourceBadge(voie: Cof2eVoie): string {
    return voie.source === 'peuple' ? 'Peuple' : 'Profil';
  }

  /**
   * Obtient la classe CSS pour le badge source
   */
  getSourceBadgeClass(voie: Cof2eVoie): string {
    return voie.source === 'peuple' ? 'source-peuple' : 'source-profil';
  }
}
