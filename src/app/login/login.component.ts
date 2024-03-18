import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseUrlService } from '../services/base-url.service';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  providers: [UserService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  user: any = {};
  errorMessage: string = '';

  constructor(private http: HttpClient,
    private baseUrlService: BaseUrlService,
    private userService: UserService,
    private router: Router) { }

  async login() {
    const requestBody = { email: this.email, password: this.password };
    console.log(requestBody);

    try {
      const baseUrl = this.baseUrlService.baseUrl;
      const response: any = await this.http
        .post(`${baseUrl}/api/login`, requestBody)
        .toPromise();

      localStorage.setItem('userId', response.user.id);
      localStorage.setItem('token', response.token);
      console.log(response.token);

      this.userService.setLoggedInUser(response.user);
      this.router.navigate(['/chat']);
    } catch (error: any) {
      console.error(error);

    }
  }


}
