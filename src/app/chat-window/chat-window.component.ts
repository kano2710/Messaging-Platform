import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { io } from 'socket.io-client';
import { BaseUrlService } from '../services/base-url.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  message: string;
  fromSelf: boolean;
  tempId?: number;
  messageId?: number;
}

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [HttpClientModule, FormsModule, NgFor, NgIf],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css'
})
export class ChatWindowComponent implements OnInit {

  private socket: any;
  messages: Message[] = [];
  newMessage: string = '';
  users: any[] = [];
  selectedUserId: number | null = null;
  selectedUser: any = null;

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  constructor(private router: Router, private baseUrlService: BaseUrlService, private http: HttpClient) {
    this.socket = io(this.baseUrlService.baseUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.listenForMessages();
    this.scrollToBottom();
  }

  ngAfterViewinit() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }, 100);
    } catch (err) { console.error(err); }
  }

  fetchUsers() {
    const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
    this.http.get<any[]>(`${this.baseUrlService.baseUrl}/api/users`, { headers }).subscribe(users => {
      this.users = users;
    }, error => {
      console.error('Error fetching users:', error);
    });
  }

  selectUser(id: number): void {
    this.selectedUserId = id;
    this.selectedUser = this.users.find(user => user.id === id);
    const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
    this.http.get<{ messages: any[] }>(`${this.baseUrlService.baseUrl}/api/messages/${id}`, { headers })
      .subscribe(response => {
        this.messages = response.messages.map(message => ({
          message: message.message_text,
          fromSelf: message.sender_id === Number(localStorage.getItem('userId'))
        }));
        this.scrollToBottom();
      }, error => {
        console.error('Error fetching messages:', error);
      });
  }

  listenForMessages(): void {
    this.socket.on('newMessage', (message: any) => {
      const userId = Number(localStorage.getItem('userId'));
      const existingMessageIndex = this.messages.findIndex(m => m.tempId === message.tempId);
      if (existingMessageIndex !== -1) {
        this.messages[existingMessageIndex].messageId = message.messageId;
        delete this.messages[existingMessageIndex].tempId;
      } else {
        this.messages.push({
          message: message.message_text,
          fromSelf: message.sender_id === userId,
          messageId: message.messageId,
        });
      }
      this.scrollToBottom();
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const userId = Number(localStorage.getItem('userId'));
    const tempId = Date.now();
    const body = {
      sender_id: userId,
      receiver_id: this.selectedUserId,
      message_text: this.newMessage,
      tempId,
    };

    this.messages.push({
      message: this.newMessage,
      fromSelf: true,
      tempId,
    });
    this.newMessage = '';

    const headers = {
      'Authorization': 'Bearer ' + localStorage.getItem('token'),
      'Content-Type': 'application/json',
    };

    this.http.post(`${this.baseUrlService.baseUrl}/api/messages`, body, { headers }).subscribe({
      next: (response: any) => {
        const index = this.messages.findIndex(m => m.tempId === tempId);
        if (index !== -1) {
          this.messages[index].messageId = response.messageId;
          delete this.messages[index].tempId;
        }
      },
      error: (error) => console.error('Error sending message:', error),
    });
  }

  logout() {
    this.router.navigate(['/logout']);
  }
}
