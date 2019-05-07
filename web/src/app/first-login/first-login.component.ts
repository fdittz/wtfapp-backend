import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

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
    console.log(this.auth)
      this.http.get(`/api/users/registernickname/${this.nickname}`, {
          headers: new HttpHeaders().set('Authorization', `Bearer ${this.auth.accessToken}`)
        }).subscribe(resp => {
          console.log(resp);
        });

      
  
    //return userRef.set(data, { merge: true }) 
    
  
  }

}
