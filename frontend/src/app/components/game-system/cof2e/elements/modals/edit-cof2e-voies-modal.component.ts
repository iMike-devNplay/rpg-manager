import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataItem, GameSystem } from '../../../../../models/rpg.models';
import { GameSystemDataService } from '../../../../../services/game-system-data.service';
import { StorageService } from '../../../../../services/storage.service';

interface Cof2eCapacite {
  capacite: string;
  rang: number;
  name: string;
  description: string;
  acquired: boolean;
}

interface Cof2eVoie {
  voie: string;
  name: string;
  capacites: Cof2eCapacite[];
  source: 'peuple' | 'profil';
}

@Component({
  selector: 'app-edit-cof2e-voies-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-cof2e-voies-modal.component.html',
  styleUrl: './edit-cof2e-voies-modal.component.scss'
})
export class EditCof2eVoiesModalComponent implements OnInit {
  @Input() item!: DataItem;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<DataItem>();

  voies: Cof2eVoie[] = [];
  availableVoiesFromProfil: Cof2eVoie[] = []; // Voies disponibles du profil
  selectedProfilVoies: string[] = []; // IDs des 2 voies sélectionnées du profil
  niveau: number = 1;

  constructor(
    private gameSystemDataService: GameSystemDataService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAvailableVoies();
    this.loadVoiesFromItem();
    this.loadNiveauFromCharacter();
    this.updateAcquiredCapacitiesBasedOnLevel();
    // Forcer la détection de changements après le chargement asynchrone
    this.cdr.detectChanges();
  }

  /**
   * Charge les voies disponibles depuis cof-data.json
   */
  private async loadAvailableVoies(): Promise<void> {
    try {
      const cof2eData = await this.gameSystemDataService.loadGameSystemData(GameSystem.COF2E).toPromise();
      if (!cof2eData) return;

      // Récupérer le personnage courant pour obtenir peuple et profil
      const character = this.storageService.getCurrentCharacter();
      if (!character) return;

      // Trouver l'élément Peuple
      const peupleElement = character.dataItems.find(item => 
        item.metadata?.['cof2eType'] === 'peuple'
      );
      const peupleValue = peupleElement?.value as string;

      // Trouver l'élément Profil
      const profilElement = character.dataItems.find(item => 
        item.metadata?.['cof2eType'] === 'profil'
      );
      const profilValue = profilElement?.value as string;

      // Charger la voie du peuple si un peuple est sélectionné
      console.log('Chargement voie peuple - peupleValue:', peupleValue);
      if (peupleValue && cof2eData.peuples) {
        const peuple = cof2eData.peuples.find((p: any) => p.peuple === peupleValue);
        console.log('Peuple trouvé:', peuple);
        if (peuple?.voie) {
          // Ajouter la voie du peuple aux voies disponibles
          const voiePeuple: Cof2eVoie = {
            voie: peuple.voie.voie,
            name: peuple.voie.name,
            capacites: (peuple.voie.capacites || []).map((c: any) => ({
              capacite: c.capacite,
              rang: c.rang,
              name: c.name,
              description: c.description || '',
              acquired: false
            })),
            source: 'peuple'
          };
          
          console.log('Voie peuple créée:', voiePeuple);
          // Ajouter si pas déjà présente
          if (!this.voies.find(v => v.voie === voiePeuple.voie)) {
            this.voies.push(voiePeuple);
            console.log('Voie peuple ajoutée. Total voies:', this.voies.length);
          }
        }
      }

      // Charger les voies disponibles du profil si un profil est sélectionné
      console.log('Chargement voies profil - profilValue:', profilValue);
      if (profilValue && cof2eData.familles) {
        // Trouver le profil dans les familles
        for (const famille of cof2eData.familles) {
          if (famille.profils) {
            const profil = famille.profils.find((p: any) => p.name === profilValue);
            if (profil?.voies) {
              this.availableVoiesFromProfil = profil.voies.map((v: any) => ({
                voie: v.voie,
                name: v.name,
                capacites: (v.capacites || []).map((c: any) => ({
                  capacite: c.capacite,
                  rang: c.rang,
                  name: c.name,
                  description: c.description || '',
                  acquired: false
                })),
                source: 'profil'
              }));
              console.log('Voies profil disponibles:', this.availableVoiesFromProfil.length);
              break;
            }
          }
        }
      }
      
      console.log('Fin loadAvailableVoies - Total voies:', this.voies.length);
      console.log('Voies disponibles profil:', this.availableVoiesFromProfil.length);
    } catch (error) {
      console.error('Erreur lors du chargement des voies:', error);
    }
  }

  /**
   * Charge les voies depuis l'item et fusionne avec les voies sauvegardées
   */
  private loadVoiesFromItem(): void {
    console.log('loadVoiesFromItem - metadata:', this.item?.metadata);
    if (this.item?.metadata?.['voies'] && Array.isArray(this.item.metadata['voies'])) {
      const savedVoies = this.item.metadata['voies'] as Cof2eVoie[];
      console.log('Voies sauvegardées trouvées:', savedVoies.length);
      
      // Fusionner les voies sauvegardées avec les voies chargées depuis cof-data.json
      // Garder l'état "acquired" des capacités sauvegardées
      savedVoies.forEach(savedVoie => {
        const existingVoie = this.voies.find(v => v.voie === savedVoie.voie);
        if (existingVoie) {
          // Mettre à jour les capacités acquises
          savedVoie.capacites.forEach(savedCap => {
            const existingCap = existingVoie.capacites.find(c => c.capacite === savedCap.capacite);
            if (existingCap) {
              existingCap.acquired = savedCap.acquired;
            }
          });
        } else {
          // Ajouter la voie si elle n'existe pas déjà
          this.voies.push(savedVoie);
        }
      });
    }
    
    // Charger les voies sélectionnées du profil
    this.selectedProfilVoies = this.voies
      .filter(v => v.source === 'profil')
      .map(v => v.voie);
    
    console.log('Fin loadVoiesFromItem - Total voies:', this.voies.length);
    console.log('Voies sélectionnées profil:', this.selectedProfilVoies.length);
  }

  /**
   * Charge le niveau du personnage (si disponible dans les métadonnées)
   */
  private loadNiveauFromCharacter(): void {
    if (this.item?.metadata?.['niveau']) {
      this.niveau = this.item.metadata['niveau'];
    }
  }

  /**
   * Met à jour les capacités acquises en fonction du niveau
   * Au niveau 1, on acquiert le rang 1 de toutes les voies
   */
  private updateAcquiredCapacitiesBasedOnLevel(): void {
    this.voies.forEach(voie => {
      voie.capacites.forEach(capacite => {
        // Au niveau 1, acquérir le rang 1
        if (this.niveau >= 1 && capacite.rang === 1) {
          capacite.acquired = true;
        }
        // Logique à étendre pour les autres niveaux
        // Par exemple: niveau 2 = rang 1-2, niveau 3 = rang 1-3, etc.
        if (capacite.rang <= this.niveau) {
          capacite.acquired = true;
        }
      });
    });
  }

  /**
   * Bascule l'état d'acquisition d'une capacité
   */
  toggleCapacite(voie: Cof2eVoie, capacite: Cof2eCapacite): void {
    capacite.acquired = !capacite.acquired;
  }

  /**
   * Vérifie si une voie du profil est sélectionnée
   */
  isProfilVoieSelected(voieId: string): boolean {
    return this.selectedProfilVoies.includes(voieId);
  }

  /**
   * Sélectionne/désélectionne une voie du profil
   */
  toggleProfilVoie(voie: Cof2eVoie): void {
    const index = this.selectedProfilVoies.indexOf(voie.voie);
    
    if (index > -1) {
      // Désélectionner
      this.selectedProfilVoies.splice(index, 1);
      // Retirer la voie de la liste
      this.voies = this.voies.filter(v => v.voie !== voie.voie);
    } else {
      // Vérifier qu'on ne dépasse pas 2 voies de profil
      if (this.selectedProfilVoies.length < 2) {
        // Sélectionner
        this.selectedProfilVoies.push(voie.voie);
        // Ajouter la voie à la liste
        const newVoie = JSON.parse(JSON.stringify(voie));
        newVoie.source = 'profil';
        this.voies.push(newVoie);
      }
    }
    
    // Mettre à jour les capacités acquises
    this.updateAcquiredCapacitiesBasedOnLevel();
  }

  /**
   * Retire une voie (peuple ou profil)
   */
  removeVoie(voie: Cof2eVoie): void {
    // Retirer de la liste des voies affichées
    const index = this.voies.findIndex(v => v.voie === voie.voie && v.source === voie.source);
    if (index > -1) {
      this.voies.splice(index, 1);
    }

    // Si c'est une voie de profil, retirer aussi de la liste des sélections
    if (voie.source === 'profil') {
      const selectedIndex = this.selectedProfilVoies.indexOf(voie.voie);
      if (selectedIndex > -1) {
        this.selectedProfilVoies.splice(selectedIndex, 1);
      }
    }
  }

  /**
   * Obtient le nombre de capacités acquises dans une voie
   */
  getAcquiredCount(voie: Cof2eVoie): number {
    return voie.capacites.filter(c => c.acquired).length;
  }

  /**
   * Ferme la modale sans sauvegarder
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Sauvegarde les modifications
   */
  onSave(): void {
    // Mettre à jour les métadonnées de l'item
    if (!this.item.metadata) {
      this.item.metadata = {};
    }
    
    this.item.metadata['voies'] = this.voies;
    
    this.save.emit(this.item);
    this.close.emit();
  }
}
