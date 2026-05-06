import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { WebsocketService } from '../../services/websocket';
import { ChatMessageDTO, TypingDTO } from '../../models/message.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { auth } from '../../../../core/config/firebase.config';
import { getIdToken } from 'firebase/auth';

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
  showEmojiPicker = false;
commonEmojis = [
  '😊', '😂', '👍', '❤️', '🔥', '🤔', '🙌', '🎉', '👋', '✨',
  '😁', '🤣', '😍', '😎', '🥳', '😭', '😡', '🤩', '😅', '😉',
  '😢', '😴', '🤯', '😱', '🥺', '🤗', '🤝', '👏', '💯', '👌',
  '💪', '🙏', '🎶', '💖', '🌟', '🎮', '🚀', '🍕', '☕', '🌈',
  '🥶', '😈', '👀', '🫡', '😋', '🤤', '🧠', '💀', '🫶', '😬',
  '🐱', '🐶', '🦁', '⚡', '🌍', '📚', '🛠️', '📱', '💻', '⌚',
  '🎵', '🏆', '⚽', '🏀', '🎬', '📸', '✈️', '🚗', '🛒', '🎁'
];  
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;

  private typingSubject = new Subject<void>();
  private subs = new Subscription();

  constructor(
    private wsService: WebsocketService,
    private http: HttpClient
  ) {
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

  async send(): Promise<void> {
    const trimmed = this.content.trim();
    if (!trimmed && !this.selectedFile) return;

    let imageUrl: string | undefined;

    if (this.selectedFile) {
      this.isUploading = true;
      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        // Récupération manuelle du token pour être SÛR à 100%
        let token = '';
        if (auth.currentUser) {
          token = await getIdToken(auth.currentUser);
        }

        if (!token) {
          console.error('[Chat] No auth token found!');
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          return;
        }
        
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        console.log('[Chat] Uploading image with manual token...');
        const res = await this.http.post<{url: string}>(
          'http://localhost:8080/api/chat/upload', 
          formData,
          { headers }
        ).toPromise();
        imageUrl = res?.url;
        console.log('[Chat] Upload success, URL:', imageUrl);
      } catch (err: any) {
        console.error('[Chat] Upload failed details:', err);
        alert('Erreur lors du téléchargement de l\'image : ' + (err.message || 'Serveur injoignable'));
        return;
      } finally {
        this.isUploading = false;
      }
    }

    const payload: ChatMessageDTO = {
      conversationId: this.conversationId,
      receiverId: this.receiverId,
      content: trimmed,
      imageUrl: imageUrl
    };

    this.wsService.sendMessage(payload);
    this.content = '';
    this.selectedFile = null;
    this.imagePreview = null;
    this.showEmojiPicker = false;
    this.sendTypingEvent(false);
    this.messageSent.emit();
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string, event: MouseEvent): void {
    event.stopPropagation();
    this.content += emoji;
    this.onInput();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('L\'image est trop lourde (maximum 10 Mo).');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removePreview(): void {
    this.selectedFile = null;
    this.imagePreview = null;
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
