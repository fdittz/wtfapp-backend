import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-first-login',
  templateUrl: './first-login.component.html',
  styleUrls: ['./first-login.component.scss']
})
export class FirstLoginComponent implements OnInit {

  nickname: string;
  constructor(
    public auth: AuthService,
    private http: HttpClient) { 
    
  }


  ngOnInit() {

  }

  async registerNickname() {
  		return this.auth.registerNickname(this.nickname);
	
		//return userRef.set(data, { merge: true }) 
		
	
  }

  async testApi() {
      this.http.get('http://localhost:3000/api/users', {
          headers: new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`)
        })
        .then((data) => {
          console.log(data);
        });
      
  
    //return userRef.set(data, { merge: true }) 
    
  
  }

}
