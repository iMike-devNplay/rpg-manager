import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { PlayerCharacter } from '../../../../models/rpg.models';
import { Dnd5eService } from '../../../../services/dnd5e.service';
import { CharacterService } from '../../../../services/character.service';

@Component({
  selector: 'app-dnd5e-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dnd5e-dashboard.component.html',
  styleUrl: './dnd5e-dashboard.component.scss'
})
export class Dnd5eDashboardComponent implements OnInit, OnDestroy {
  @Input() character: PlayerCharacter | null = null;

  proficiencyBonus: number = 2;
  attributes: any[] = [];
  
  private subscription?: Subscription;

  constructor(
    private dnd5eService: Dnd5eService,
    private characterService: CharacterService
  ) {}

  ngOnInit(): void {
    this.loadDnd5eData();
    
    // S'abonner aux changements du personnage
    this.subscription = this.characterService.currentCharacter$.subscribe(character => {
      this.character = character;
      this.loadDnd5eData();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private loadDnd5eData(): void {
    if (!this.character) return;

    // Charger le bonus de maîtrise
    const profBonusItem = this.character.dataItems.find(item => 
      item.metadata?.dnd5eType === 'proficiency-bonus'
    );
    this.proficiencyBonus = profBonusItem ? Number(profBonusItem.value) : 2;

    // Charger les attributs
    this.attributes = this.character.dataItems
      .filter(item => item.metadata?.dnd5eType === 'attribute')
      .map(item => ({
        id: item.id,
        name: item.name,
        value: Number(item.value),
        hasProficiency: item.metadata?.hasProficiency || false,
        attributeCode: item.metadata?.attributeCode
      }))
      .sort((a, b) => {
        const order = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA'];
        const indexA = order.indexOf(a.attributeCode || '');
        const indexB = order.indexOf(b.attributeCode || '');
        return indexA - indexB;
      });
  }

  getModifierDisplay(attributeValue: number): string {
    const modifier = this.dnd5eService.calculateAttributeModifier(attributeValue);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  getSavingThrowDisplay(attr: any): string {
    const savingThrow = this.dnd5eService.calculateSavingThrow(
      attr.value, 
      attr.hasProficiency, 
      this.proficiencyBonus
    );
    return savingThrow >= 0 ? `+${savingThrow}` : `${savingThrow}`;
  }

  toggleSaveProficiency(attr: any, event: any): void {
    if (!this.character) return;

    const dataItem = this.character.dataItems.find(item => item.id === attr.id);
    if (dataItem && dataItem.metadata) {
      dataItem.metadata.hasProficiency = event.target.checked;
      
      // Sauvegarder la modification
      this.characterService.updateCharacter(this.character);
      
      // Mettre à jour l'affichage
      attr.hasProficiency = event.target.checked;
    }
  }

  recalculateAll(): void {
    if (!this.character) return;

    try {
      this.dnd5eService.updateCalculatedValues(this.character);
      this.loadDnd5eData(); // Recharger les données
      
      // Recharger le personnage depuis le service
      const updatedCharacter = this.characterService.getCurrentCharacter();
      if (updatedCharacter) {
        this.character = updatedCharacter;
      }
    } catch (error) {
      console.error('Erreur lors du recalcul:', error);
      alert('Erreur lors du recalcul des valeurs.');
    }
  }
}