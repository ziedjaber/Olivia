// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Message } from '../../models/message.model';

// @Component({
//   selector: 'app-message-bubble',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './message-bubble.html',
//   styleUrls: ['./message-bubble.css']
// })
// export class MessageBubbleComponent {

//   @Input() message!: Message;
//   @Input() isOwn: boolean = false;
// }

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.html',
  styleUrls: ['./message-bubble.css']
})
export class MessageBubbleComponent {

  @Input() message!: Message;
  @Input() isOwn: boolean = false;

  // Formatage de l'heure (ex: 14:35)
  get formattedTime(): string {
    if (!this.message?.timestamp) return '';
    
    const date = new Date(this.message.timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Statut "lu" uniquement pour les messages envoyés par l'utilisateur actuel
  get showReadStatus(): boolean {
    return this.isOwn && this.message?.read !== undefined;
  }

  getFullImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
  }
}
