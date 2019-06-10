import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  msgError: string;
  stats: any;
  constructor(public auth: AuthService,
    private http: HttpClient) { }

  ngOnInit() {
    this.getMatches()
  }

  async getMatches() {
    return this.http.get(`/api/matches`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.stats = resp;
    }, resp => {
        this.msgError = resp.error.message;
    })
  }
}
