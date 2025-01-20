import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-report-balance',
  templateUrl: './report-balance.component.html',
  styleUrls: ['./report-balance.component.scss']
})
export class ReportBalanceComponent implements OnInit {

  constructor(
    private router: Router,
  ) { }

  ngOnInit(): void {
  }

  addBalance(){
    this.router.navigate(['balance/assign'])

  }

}
