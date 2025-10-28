import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataItem, ResourceCounterElement } from '../../../../models/rpg.models';

@Component({
  selector: 'app-resource-counter-element',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-counter-element.component.html',
  styleUrl: './resource-counter-element.component.scss'
})
export class ResourceCounterElementComponent {
  @Input() item!: DataItem;
  @Output() valueChange = new EventEmitter<ResourceCounterElement>();

  get resourceData(): ResourceCounterElement {
    if (typeof this.item.value === 'object' && this.item.value !== null) {
      return this.item.value as ResourceCounterElement;
    }
    // Valeur par défaut si mal formatée
    return {
      currentValue: 0,
      maxValue: undefined
    };
  }

  get hasMaxValue(): boolean {
    return this.resourceData.maxValue !== undefined && this.resourceData.maxValue !== null;
  }

  get canIncrease(): boolean {
    if (!this.hasMaxValue) return true;
    return this.resourceData.currentValue < this.resourceData.maxValue!;
  }

  get canDecrease(): boolean {
    return this.resourceData.currentValue > 0;
  }

  onIncrease(): void {
    if (this.canIncrease) {
      const newData: ResourceCounterElement = {
        ...this.resourceData,
        currentValue: this.resourceData.currentValue + 1
      };
      this.valueChange.emit(newData);
    }
  }

  onDecrease(): void {
    if (this.canDecrease) {
      const newData: ResourceCounterElement = {
        ...this.resourceData,
        currentValue: this.resourceData.currentValue - 1
      };
      this.valueChange.emit(newData);
    }
  }


}