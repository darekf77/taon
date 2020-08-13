import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-base-module',
  templateUrl: './base-module.component.html',
  styleUrls: ['./base-module.component.css']
})
export class BaseModuleComponent implements OnInit {

  constructor(public router: Router) { }

  ngOnInit() {
  }

  aa() {
    this.router.navigateByUrl('/route')
  }

}

