import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { User  } from '../model/user.model';
import {Location} from '@angular/common';
import { Chart } from 'chart.js';
import { ActivatedRoute,  ParamMap } from '@angular/router';

@Component({
  selector: 'app-head-to-head',
  templateUrl: './head-to-head.component.html',
  styleUrls: ['./head-to-head.component.scss']
})
export class HeadToHeadComponent implements OnInit {
  player1login: string;
  player2login: string;
  msgError: string;
  player1: User;
  player2: User;
  stats: any;
  constructor(public auth: AuthService,
    private http: HttpClient,
    private location: Location,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (paramMap["params"].login1 && paramMap["params"].login2) {
        this.player1login = paramMap["params"].login1;
        this.player2login = paramMap["params"].login2;
        this.headToHead();
      }
    });
  }
  
  async getProfileData(login) {
    var self = this;
    return this.http.get(`/api/users/${login}`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).toPromise();
  }


  async headToHead() {
    this.stats = [];
    this.player1 = null;
    this.player2 = null;
    this.player1login = this.player1login.toLowerCase();
    this.player2login = this.player2login.toLowerCase();

    Promise.all([this.getProfileData(this.player1login), this.getProfileData(this.player2login)])
    .then( players => {
      this.player1 = <User>players[0];
      this.player2 = <User>players[1];
      this.location.replaceState(`/headtohead/${this.player1.login}/${this.player2.login}`);
      this.getStatsData(this.player1.login, this.player2.login);
    });  
  }

  async getStatsData(login1, login2) {
    return this.http.get(`/api/users/headtohead/${login1}/${login2}`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${await this.auth.accessToken}`)
    }).subscribe(resp => {
      this.stats = <any>resp;
      this.pieChart()
    }, resp => {
        this.msgError = resp.error.message;
    })
  }

  private pieChart() {
    var pieChartCanvas = <HTMLCanvasElement>document.getElementById('pieChart');
    var ctx = pieChartCanvas.getContext('2d')
    var pieData        = {
      labels: [
          this.player2.login,
          this.player1.login
      ],
      datasets: [
        {
          data: [this.stats["defeats"], this.stats["victories"]],
          backgroundColor : ['#dc3545', '#007bff']
        }
      ]
    }
    var pieOptions     = {
      maintainAspectRatio: false,
      legend: {
        display: false
      },
      responsive: true
    }
    //Create pie or douhnut chart
    // You can switch between pie and douhnut using the method below.
    var pieChart = new Chart(ctx, {
      type: 'pie',
      data: pieData,
      options: pieOptions      
    })
  }
}
