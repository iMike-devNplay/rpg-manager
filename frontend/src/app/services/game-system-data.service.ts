import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GameSystem } from '../models/rpg.models';

export interface GameSystemData {
  'game-system': string;
  name: string;
  classes?: any[];
  origines?: any[];
  attributes?: any[];
  historiques?: any[];
  races?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class GameSystemDataService {

  /**
   * Charge les données d'un système de jeu
   */
  loadGameSystemData(gameSystem: GameSystem): Observable<GameSystemData | null> {
    if (!gameSystem || gameSystem === null) {
      return of(null);
    }

    // Gestion des systèmes de jeu supportés
    if (gameSystem === 'dnd5e') {
      return this.loadDnd5eData();
    }
    
    if (gameSystem === 'dnd4e') {
      return this.loadDnd4eData();
    }

    return of(null);
  }

  /**
   * Vérifie si un système de jeu a des données spécifiques
   */
  hasGameSystemData(gameSystem: GameSystem): boolean {
    return gameSystem === 'dnd5e' || gameSystem === 'dnd4e';
  }

  /**
   * Charge les données D&D 5e
   */
  private loadDnd5eData(): Observable<GameSystemData> {
    // En production, ceci serait un appel HTTP
    // Pour le moment, on importe directement le fichier JSON
    return new Observable(observer => {
      import('../data/dnd5e-data.json').then(data => {
        observer.next(data.default || data);
        observer.complete();
      }).catch(error => {
        console.error('Erreur lors du chargement des données D&D 5e:', error);
        observer.error(error);
      });
    });
  }

  /**
   * Charge les données D&D 4e
   */
  private loadDnd4eData(): Observable<GameSystemData> {
    return new Observable(observer => {
      import('../data/dnd4e-data.json').then(data => {
        observer.next(data.default || data);
        observer.complete();
      }).catch(error => {
        console.error('Erreur lors du chargement des données D&D 4e:', error);
        observer.error(error);
      });
    });
  }
}