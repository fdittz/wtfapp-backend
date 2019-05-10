import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './auth.guard'
import { LoginComponent } from './login/login.component'
import { FirstLoginComponent } from './first-login/first-login.component'
import { ProfileComponent } from './profile/profile.component'

const routes: Routes = [
	{ path: '', component: LoginComponent},
	{ path: 'first',	component: FirstLoginComponent,  canActivate: [AuthGuard] },
	{ path: 'profile/:nickname',	component: ProfileComponent,  canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
