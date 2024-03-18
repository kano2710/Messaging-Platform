import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [LoginComponent, HttpClientModule],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent implements OnInit {
  constructor(private router: Router) { }

  ngOnInit() {
    this.logout();
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}