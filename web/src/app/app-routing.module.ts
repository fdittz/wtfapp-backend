import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard'
import { LoggedGuard } from './logged.guard'
import { LoginGuard } from './login.guard'
import { LoginComponent } from './login/login.component'
import { FirstLoginComponent } from './first-login/first-login.component'
import { ProfileComponent } from './profile/profile.component'
import { RootComponent } from './root/root.component'
import { PlayerListComponent } from './player-list/player-list.component';

const routes: Routes = [
	{ path: '', component: RootComponent, canActivate: [LoggedGuard] },
	{ path: 'login', component: LoginComponent },
	{ path: 'first',	component: FirstLoginComponent,  canActivate: [AuthGuard, LoginGuard] },
	{ path: 'profile',	component: ProfileComponent,  canActivate: [AuthGuard, LoginGuard] },
	{ path: 'profile/:login',	component: ProfileComponent,  canActivate: [AuthGuard, LoginGuard] },
	{ path: 'playerlist',	component: PlayerListComponent,  canActivate: [AuthGuard, LoginGuard] },
	{ path: 'playerlist/:page',	component: PlayerListComponent,  canActivate: [AuthGuard, LoginGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
