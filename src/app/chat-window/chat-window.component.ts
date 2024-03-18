import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { io } from 'socket.io-client';
import { BaseUrlService } from '../services/base-url.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [HttpClientModule, FormsModule, NgFor, NgIf],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.css'
})
export class ChatWindowComponent implements OnInit {

  private socket: any;
  messages: { message: string, fromSelf: boolean }[] = [];
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
    this.socket.on('newMessage', (newMessage: any) => {
      console.log("Received message:", newMessage);
      if (newMessage.receiver_id == this.selectedUserId || newMessage.sender_id == this.selectedUserId) {
        this.messages.push({
          message: newMessage.message_text,
          fromSelf: newMessage.sender_id === Number(localStorage.getItem('userId')),
        });
        this.scrollToBottom();
      }
    });

    this.socket.on('receiveMessage', (newMessage: any) => {
      if (newMessage.fromUserId === this.selectedUserId || newMessage.toUserId === this.selectedUserId) {
        this.messages.push({ message: newMessage.content, fromSelf: newMessage.fromSelf });
        this.scrollToBottom();
      }
    });
  }


  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const id = localStorage.getItem('userId');
    const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' };
    const body = { sender_id: id, receiver_id: this.selectedUserId, message_text: this.newMessage };

    this.http.post(`${this.baseUrlService.baseUrl}/api/messages`, body, { headers }).subscribe({
      next: (response) => {
        this.scrollToBottom();
        console.log("Message saved successfully", response);
        this.socket.emit('sendMessage', { userId: this.selectedUserId, message: this.newMessage });
        this.messages.push({ message: this.newMessage, fromSelf: true });
        this.newMessage = '';
      },
      error: (error) => console.error('Error sending message:', error)
    });
  }


  logout() {
    this.router.navigate(['/logout']);
  }
}
