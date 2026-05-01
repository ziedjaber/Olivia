import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { db } from '../config/firebase.config';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { WebsocketService } from '../../features/chat/services/websocket';

export interface Notification {
  id: string;
  recipientUid: string;
  title: string;
  body: string;
  type: string;
  referenceId: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private wsService = inject(WebsocketService);
  
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  
  private unsubscribeSnapshot: (() => void) | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    // Listen for real-time signals via WebSocket as a primary trigger
    this.wsService.notifications$.subscribe((notif: any) => {
      console.log('[NotificationService] Signal received via WebSocket!', notif);
      
      // Only play sound if it's a NEW notification (not a read update)
      if (notif.type !== 'READ_UPDATE' && notif.type !== 'READ_ALL_UPDATE') {
        this.playNotificationSound();
      }
      
      this.refreshNotifications(); // Re-sync state for all tabs
    });

    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.refreshNotifications(); // Initial fetch
        this.listenToNotifications(user.id);
      } else {
        this.stopListening();
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  refreshNotifications() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.http.get<Notification[]>('http://localhost:8080/api/notifications').subscribe({
      next: (data) => {
        console.log('[NotificationService] API Fetch Success:', data);
        this.notifications.set(data);
        this.unreadCount.set(data.filter(n => !n.read).length);
      },
      error: (err) => console.error('[NotificationService] API Fetch Error:', err)
    });
  }

  private listenToNotifications(uid: string) {
    this.stopListening();
    
    const notifRef = collection(db, 'notifications');
    const q = query(
      notifRef,
      where('recipientUid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    console.log(`[NotificationService] Starting listener for UID: ${uid}`);
    this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      console.log(`[NotificationService] Snapshot received! Count: ${snapshot.size}`);
      const notifs: Notification[] = [];
      let newUnreadFound = false;

      snapshot.docChanges().forEach((change) => {
        console.log(`[NotificationService] Change detected: ${change.type}`, change.doc.data());
        if (change.type === 'added') {
          const data = change.doc.data() as Notification;
          if (!data.read) {
            newUnreadFound = true;
          }
        }
      });

      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });

      // Sort client-side since Firestore requires composite index for multiple orderBys
      notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      this.notifications.set(notifs);
      this.unreadCount.set(notifs.filter(n => !n.read).length);

      // Play sound only on 'added' changes when unread
      if (newUnreadFound && notifs.length > 0) {
        this.playNotificationSound();
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("[NotificationService] Firestore direct access denied (Security Rules). Falling back to REST API only.");
      } else {
        console.error("[NotificationService] Firestore listener error:", error);
      }
      // Force a refresh via REST just in case
      this.refreshNotifications();
    });
  }

  private stopListening() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
  }

  markAsRead(notificationId: string) {
    this.http.put(`http://localhost:8080/api/notifications/${notificationId}/read`, {}, { responseType: 'text' })
      .subscribe({
        error: (err) => console.error("Failed to mark notification as read", err)
      });
  }

  markAllAsRead() {
    this.http.put(`http://localhost:8080/api/notifications/read-all`, {}, { responseType: 'text' })
      .subscribe({
        error: (err) => console.error("Failed to mark all notifications as read", err)
      });
  }

  // Generate a subtle ding sound using Web Audio API
  private playNotificationSound() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      
      const osc1 = this.audioContext.createOscillator();
      const gain1 = this.audioContext.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.1, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(this.audioContext.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      const osc2 = this.audioContext.createOscillator();
      const gain2 = this.audioContext.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(698, now + 0.1);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.1, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(this.audioContext.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.log("Audio not supported or blocked by browser autoplay policy.");
    }
  }
}
