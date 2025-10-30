import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PlayerCharacter } from '../../../../models/rpg.models';
import { Dnd4eService } from '../../../../services/dnd4e.service';
import { CharacterService } from '../../../../services/character.service';

@Component({
  selector: 'app-dnd4e-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd4e-dashboard.component.html',
  styleUrl: './dnd4e-dashboard.component.scss'
})
export class Dnd4eDashboardComponent implements OnInit, OnDestroy {
  @Input() character: PlayerCharacter | null = null;
  
  private subscription?: Subscription;

  constructor(
    private dnd4eService: Dnd4eService,
    private characterService: CharacterService
  ) {}

  ngOnInit(): void {
    this.loadDnd4eData();
    
    // S'abonner aux changements du personnage
    this.subscription = this.characterService.currentCharacter$.subscribe(character => {
      this.character = character;
      this.loadDnd4eData();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadDnd4eData(): void {
    if (!this.character) return;

    // Pour le moment, pas de données spécifiques à charger
    // Nous ajouterons les éléments spécifiques D&D 4e plus tard
  }
}
