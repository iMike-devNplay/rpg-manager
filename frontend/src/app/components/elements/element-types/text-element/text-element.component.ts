import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextElement } from '../../../../models/element-types';

@Component({
  selector: 'app-text-element',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-element.component.html',
  styleUrls: ['./text-element.component.scss']
})
export class TextElementComponent {
  @Input() element!: TextElement;
  @Input() canQuickModify: boolean = false;
  
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() valueChange = new EventEmitter<string>();

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }

  onValueChange(newValue: string): void {
    this.valueChange.emit(newValue);
  }
}