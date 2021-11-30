import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard'
import { LoggedGuard } from './logged.guard'
import { LoginGuard } from './login.guard'
import { LoginComponent } from './login/login.component'
import { FirstLoginComponent } from './first-login/first-login.component'
import { ProfileComponent } from './profile/profile.component'
import { RootComponent } from './root/root.component'
import { HomeComponent } from './home/home.component'
import { PlayerListComponent } from './player-list/player-list.component';
import { HeadToHeadComponent} from './head-to-head/head-to-head.component';
import { MatchComponent } from './match/match.component';
import { ResultSimComponent } from './result-sim/result-sim.component';

const routes: Routes = [
	{ path: '', component: HomeComponent, canActivate: [ /*AuthGuard,*/  LoginGuard]},
	{ path: 'login', component: LoginComponent },
	{ path: 'first',	component: FirstLoginComponent,  canActivate: [AuthGuard] },
	{ path: 'profile',	component: ProfileComponent,  canActivate: [ AuthGuard, LoginGuard] },
	{ path: 'profile/:login',	component: ProfileComponent,  canActivate: [/* AuthGuard,*/ LoginGuard] },
	{ path: 'playerlist',	component: PlayerListComponent,  canActivate: [/* AuthGuard,*/ LoginGuard] },
	{ path: 'playerlist/:page',	component: PlayerListComponent,  canActivate: [/* AuthGuard,*/ LoginGuard] },
	{ path: 'headtohead',	component: HeadToHeadComponent,  canActivate: [/* AuthGuard, */ LoginGuard] },
	{ path: 'headtohead/:login1/:login2',	component: HeadToHeadComponent,  canActivate: [/* AuthGuard, */ LoginGuard] },
	{ path: 'simulator',	component: ResultSimComponent,  canActivate: [/* AuthGuard, */ LoginGuard] },
	{ path: 'simulator/:team1p1/:team1p2/:team2p1/:team2p2', component: ResultSimComponent,  canActivate: [/* AuthGuard, */ LoginGuard] },
	{ path: 'match/:matchId',	component: MatchComponent,  canActivate: [/* AuthGuard, */ LoginGuard] },
	{ path: 'home',	component: HomeComponent,  canActivate: [ /*AuthGuard,*/  LoginGuard] },
	{ path: 'home2',	component: HomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
