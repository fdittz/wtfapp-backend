import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service'
import { IndexService }  from './index.service'
import { Observable } from 'rxjs';
import { of } from 'rxjs'
import { tap, map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate{
	 constructor(private auth: AuthService, private router: Router, private indexService: IndexService) {}

	 canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
      if (next.params.hasOwnProperty("index")) {
        this.indexService.changeIndex(next.params.index);
      }
      return this.auth.user$.pipe(
        map(user => {   
          if (user && !user.login) {
            this.auth.redirectUrl = state.url;
            this.router.navigate(['/first']);
          }
          return true;
        })
      )
	}
}
