import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService} from './auth.service'
import { tap, map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoggedGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {

     return this.auth.user$.pipe(
         take(1),
         map(user => !!user), // <-- map to boolean
         tap(loggedIn => {				
              if (loggedIn) {
                this.auth.user$.subscribe(userdata => {                  
                  //this.router.navigate([`/profile/${userdata.login}`]);
                  this.router.navigate([`/home/`]);
                })
                return true;
              }
              else
              {
                this.router.navigate([`/login`]);
                return true;
              }
         })
     );
 }
  
}
