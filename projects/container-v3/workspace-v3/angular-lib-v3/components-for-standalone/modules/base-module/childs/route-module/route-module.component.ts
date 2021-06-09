import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-route-module',
  templateUrl: './route-module.component.html',
  styleUrls: ['./route-module.component.css']
})
export class RouteModuleComponent implements OnInit {

  constructor(public router: Router) { }

  ngOnInit() {
  }

  home() {
    this.router.navigateByUrl('/')
  }

}
