import { Routes } from '@angular/router';
import { ChatWindowComponent } from './chat-window/chat-window.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './services/auth.guard';
import { LogoutComponent } from './logout/logout.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'chat', component: ChatWindowComponent, canActivate: [AuthGuard]},
    { path: 'logout', component: LogoutComponent}
];
