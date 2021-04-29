import { switchMap } from 'rxjs/operators';
import { HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { HttpHandler } from '@angular/common/http';
import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpInterceptor } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { IndexService }  from '../index.service'
@Injectable()
export class HttpReqInterceptor implements HttpInterceptor {

  constructor(private auth: AuthService, private index: IndexService) {

  }
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let currentIndex: string = null;
    this.index.currentIndex.subscribe(index => currentIndex = index);

    return from(this.auth.accessToken)
      .pipe(
        switchMap(token => {
          const newReq = req.clone({
            headers: req.headers.set('Authorization' , `Bearer ${token}`)
          })
          return next.handle(newReq);
        })
      )    
  }  
}