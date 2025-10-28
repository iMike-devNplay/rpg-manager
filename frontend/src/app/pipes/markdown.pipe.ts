import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
    // Configuration de marked pour un rendu inline (pas de <p> englobant)
    marked.setOptions({
      breaks: true, // Convertir les sauts de ligne en <br>
      gfm: true     // GitHub Flavored Markdown
    });
  }

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    try {
      // Convertir le Markdown en HTML
      const html = marked.parse(value, { async: false }) as string;
      
      // Sanitizer le HTML pour la sécurité
      return this.sanitizer.sanitize(1, html) || '';
    } catch (error) {
      console.error('Erreur lors de la conversion Markdown:', error);
      return value;
    }
  }
}
