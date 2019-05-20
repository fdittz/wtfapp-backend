import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';

import { AuthService} from './auth.service'
import { Observable } from 'rxjs';
import { tap, map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate{
	 constructor(private auth: AuthService, private router: Router) {}

	 canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

	    return this.auth.user$.pipe(
	        take(1),
	        map(user => !!user), // <-- map to boolean
	        tap(loggedIn => {
            this.auth.user$.subscribe(userdata => {
              if (!userdata.login) {
                this.auth.redirectUrl = state.url;
                this.router.navigate(['/first']);
              }
              else {                
                this.router.navigate([`/profile/${userdata.login}`]);
              }
            })
	        })
	    );
	}
  
}
