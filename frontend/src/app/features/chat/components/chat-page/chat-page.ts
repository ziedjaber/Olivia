import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../services/chat';
import { ConversationListComponent } from '../conversation-list/conversation-list';
import { ChatWindowComponent } from '../chat-window/chat-window';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ConversationListComponent, ChatWindowComponent],
  templateUrl: './chat-page.html',
  styleUrls: ['./chat-page.css']
})
export class ChatPageComponent {

  private chatService = inject(ChatService);
  isChatOpen$ = this.chatService.isChatOpen$;

  closeChat() {
    this.chatService.setChatOpen(false);
  }
}