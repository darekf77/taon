import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-server-component',
  template: `
    <h1>Server Component</h1>
    <p>This component is rendered on the server.</p>
  `,
})

export class AppServerComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
