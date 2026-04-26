import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { WebsocketService } from '../../services/websocket';
import { ChatMessageDTO, TypingDTO } from '../../models/message.model';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.html',
  styleUrls: ['./message-input.css']
})
export class MessageInputComponent implements OnDestroy {

  @Input() conversationId!: string;
  @Input() receiverId!: string;
  @Output() messageSent = new EventEmitter<void>();

  content = '';
  private typingSubject = new Subject<void>();
  private subs = new Subscription();

  constructor(private wsService: WebsocketService) {
    this.subs.add(
      this.typingSubject.pipe(debounceTime(300)).subscribe(() => {
        this.sendTypingEvent(true);
      })
    );
  }

  onInput(): void {
    this.typingSubject.next();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const trimmed = this.content.trim();
    if (!trimmed) return;

    const payload: ChatMessageDTO = {
      conversationId: this.conversationId,
      receiverId: this.receiverId,
      content: trimmed
    };

    this.wsService.sendMessage(payload);
    this.content = '';
    this.sendTypingEvent(false);
    this.messageSent.emit();
  }

  private sendTypingEvent(isTyping: boolean): void {
    const payload: TypingDTO = {
      conversationId: this.conversationId,
      receiverId: this.receiverId,
      senderName: '',
      isTyping
    };
    this.wsService.sendTyping(payload);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}