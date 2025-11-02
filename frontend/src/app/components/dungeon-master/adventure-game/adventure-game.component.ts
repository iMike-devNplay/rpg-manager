import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Adventure, PlayerCharacter, GameSystem, JournalEntry } from '../../../models/rpg.models';
import { AdventureService } from '../../../services/adventure.service';
import { StorageService } from '../../../services/storage.service';

interface CharacterSynthesis {
  character: PlayerCharacter;
  userName: string;
  class: string;
  race: string;
  background: string;
  level: number;
  maxHP: number;
  armorClass: number;
  passivePerception: number;
  speed: number;
}

interface JournalDay {
  date: Date;
  dateLabel: string;
  entries: JournalEntry[];
  collapsed: boolean;
}

@Component({
  selector: 'app-adventure-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adventure-game.component.html',
  styleUrls: ['./adventure-game.component.scss']
})
export class AdventureGameComponent implements OnInit {
  adventure: Adventure | null = null;
  charactersSynthesis: CharacterSynthesis[] = [];
  journal: string = '';
  newJournalEntry: string = '';
  journalDays: JournalDay[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adventureService: AdventureService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    const adventureId = this.route.snapshot.paramMap.get('id');
    if (adventureId) {
      this.loadAdventure(adventureId);
    } else {
      this.error = 'ID d\'aventure manquant';
      this.loading = false;
    }
  }

  loadAdventure(id: string) {
    this.adventure = this.adventureService.getAdventureById(id);
    
    if (!this.adventure) {
      this.error = 'Aventure non trouvée';
      this.loading = false;
      return;
    }

    // Initialiser journalEntries si nécessaire
    if (!this.adventure.journalEntries) {
      this.adventure.journalEntries = [];
    }

    this.journal = this.adventure.journal || '';
    this.groupJournalByDay();
    this.loadCharactersSynthesis();
    this.loading = false;
  }

  loadCharactersSynthesis() {
    if (!this.adventure) return;

    this.charactersSynthesis = [];

    for (const charRef of this.adventure.characters) {
      const characters = this.storageService.getCharacters(charRef.userId);
      const character = characters.find(c => c.id === charRef.characterId);
      
      if (character) {
        const userName = this.getUserName(charRef.userId);
        const synthesis = this.extractCharacterSynthesis(character, userName);
        this.charactersSynthesis.push(synthesis);
      }
    }
  }

  getUserName(userId: string): string {
    const users = this.storageService.getUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Inconnu';
  }

  extractCharacterSynthesis(character: PlayerCharacter, userName: string): CharacterSynthesis {
    const synthesis: CharacterSynthesis = {
      character,
      userName,
      class: 'N/A',
      race: 'N/A',
      background: 'N/A',
      level: 1,
      maxHP: 0,
      armorClass: 10,
      passivePerception: 10,
      speed: 30
    };

    // Extraction des informations selon le système de jeu
    if (this.adventure?.gameSystem === GameSystem.DND5E) {
      synthesis.class = this.findDataByDnd5eType(character, 'class') || 'N/A';
      synthesis.race = this.findDataByDnd5eType(character, 'origin') || 'N/A';
      synthesis.background = this.findDataByDnd5eType(character, 'background') || 'N/A';
      synthesis.level = this.findNumericValue(character, 'dnd_level') || 1;
      synthesis.maxHP = this.findHPValue(character);
      synthesis.armorClass = this.findNumericByDnd5eType(character, 'armor-class') || 10;
      synthesis.passivePerception = this.findNumericByDnd5eType(character, 'passive-perception') || 10;
      synthesis.speed = this.extractSpeedValue(this.findDataByDnd5eType(character, 'speed') || '30');
    } else if (this.adventure?.gameSystem === GameSystem.DND4E) {
      synthesis.class = this.findDataValue(character, 'class') || 'N/A';
      synthesis.race = this.findDataValue(character, 'race') || 'N/A';
      synthesis.level = this.findNumericValue(character, 'level') || 1;
      synthesis.maxHP = this.findHPValue(character);
      synthesis.armorClass = this.findNumericValue(character, 'armor_class') || 10;
      synthesis.speed = this.extractSpeedValue(this.findDataValue(character, 'speed') || '6');
    } else if (this.adventure?.gameSystem === GameSystem.COF2E) {
      synthesis.class = this.findDataValue(character, 'voie') || 'N/A';
      synthesis.race = this.findDataValue(character, 'peuple') || 'N/A';
      synthesis.level = this.findNumericValue(character, 'level') || 1;
      synthesis.maxHP = this.findHPValue(character);
      synthesis.armorClass = this.findNumericValue(character, 'defense') || 10;
      synthesis.speed = this.extractSpeedValue(this.findDataValue(character, 'deplacement') || '10');
    }

    return synthesis;
  }

  findDataValue(character: PlayerCharacter, type: string): string | null {
    const item = character.dataItems.find((dataItem: any) => dataItem.type === type);
    if (item && item.value) {
      return String(item.value);
    }
    return null;
  }

  findNumericValue(character: PlayerCharacter, type: string): number | null {
    const item = character.dataItems.find((dataItem: any) => dataItem.type === type);
    if (item) {
      if (typeof item.value === 'number') {
        return item.value;
      }
      if (typeof item.value === 'string') {
        const num = parseInt(item.value, 10);
        return isNaN(num) ? null : num;
      }
    }
    return null;
  }

  findHPValue(character: PlayerCharacter): number {
    const item = character.dataItems.find((dataItem: any) => dataItem.type === 'hp');
    if (item && item.metadata) {
      // TOUJOURS utiliser metadata en priorité (nouvelle structure)
      const maxHP = item.metadata['maxHp'] || item.metadata['maxHP'] || item.metadata['max'];
      if (typeof maxHP === 'number') return maxHP;
      if (typeof maxHP === 'string') {
        const num = parseInt(maxHP, 10);
        return isNaN(num) ? 0 : num;
      }
    }
    // Fallback sur les propriétés directes pour compatibilité ancienne structure
    if (item && (item as any).maxHp !== undefined) {
      return (item as any).maxHp;
    }
    return 0;
  }

  // Méthodes spécifiques pour D&D 5e qui utilise metadata.dnd5eType
  findDataByDnd5eType(character: PlayerCharacter, dnd5eType: string): string | null {
    const item = character.dataItems.find((dataItem: any) => 
      dataItem.metadata?.dnd5eType === dnd5eType
    );
    if (item && item.value) {
      return String(item.value);
    }
    return null;
  }

  findNumericByDnd5eType(character: PlayerCharacter, dnd5eType: string): number | null {
    const item = character.dataItems.find((dataItem: any) => 
      dataItem.metadata?.dnd5eType === dnd5eType
    );
    if (item) {
      if (typeof item.value === 'number') {
        return item.value;
      }
      if (typeof item.value === 'string') {
        const num = parseInt(item.value, 10);
        return isNaN(num) ? null : num;
      }
    }
    return null;
  }

  extractSpeedValue(speedText: string): number {
    // Extrait le nombre d'une chaîne comme "9 m" ou "30 ft"
    const match = speedText.match(/\d+/);
    return match ? parseInt(match[0], 10) : 30;
  }

  // ============================================
  // Gestion du journal
  // ============================================

  /**
   * Groupe les entrées de journal par jour
   */
  groupJournalByDay() {
    if (!this.adventure || !this.adventure.journalEntries) {
      this.journalDays = [];
      return;
    }

    // Trier les entrées par ordre décroissant (plus récent en premier)
    const sortedEntries = [...this.adventure.journalEntries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Grouper par jour
    const dayMap = new Map<string, JournalEntry[]>();
    
    sortedEntries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      const dateKey = entryDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, []);
      }
      dayMap.get(dateKey)!.push(entry);
    });

    // Convertir en tableau de JournalDay
    this.journalDays = Array.from(dayMap.entries()).map(([dateKey, entries], index) => {
      const date = new Date(dateKey);
      const isToday = this.isToday(date);
      const isYesterday = this.isYesterday(date);
      
      let dateLabel: string;
      if (isToday) {
        dateLabel = "Aujourd'hui";
      } else if (isYesterday) {
        dateLabel = "Hier";
      } else {
        dateLabel = date.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }

      return {
        date,
        dateLabel,
        entries,
        collapsed: index !== 0 // Seul le premier jour (le plus récent) est ouvert
      };
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  }

  isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
  }

  /**
   * Ajoute une nouvelle entrée au journal
   */
  addJournalEntry() {
    if (!this.adventure || !this.newJournalEntry.trim()) return;

    const entry = this.adventureService.addJournalEntry(this.adventure.id, this.newJournalEntry);
    if (entry) {
      // Recharger l'aventure pour avoir les données à jour
      this.adventure = this.adventureService.getAdventureById(this.adventure.id);
      this.groupJournalByDay();
      this.newJournalEntry = ''; // Vider le champ de saisie
    }
  }

  /**
   * Supprime une entrée du journal
   */
  deleteJournalEntry(entryId: string) {
    if (!this.adventure) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      this.adventureService.deleteJournalEntry(this.adventure.id, entryId);
      this.adventure = this.adventureService.getAdventureById(this.adventure.id);
      this.groupJournalByDay();
    }
  }

  /**
   * Toggle l'état collapsed d'un jour
   */
  toggleDayCollapse(day: JournalDay) {
    day.collapsed = !day.collapsed;
  }

  /**
   * Formatte l'heure d'une entrée
   */
  formatEntryTime(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  onJournalChange() {
    if (this.adventure) {
      this.adventureService.updateJournal(this.adventure.id, this.journal);
    }
  }

  onBack() {
    this.router.navigate(['/adventures']);
  }

  onGoToCombat() {
    if (this.adventure) {
      // Naviguer vers la page dédiée de gestion du combat
      this.router.navigate(['/combat'], { 
        queryParams: { 
          adventureId: this.adventure.id 
        } 
      });
    }
  }

  getGameSystemLabel(): string {
    switch (this.adventure?.gameSystem) {
      case GameSystem.DND5E: return 'D&D 5e';
      case GameSystem.DND4E: return 'D&D 4e';
      case GameSystem.COF2E: return 'Chroniques Oubliées Fantasy 2e';
      default: return 'Inconnu';
    }
  }
}
