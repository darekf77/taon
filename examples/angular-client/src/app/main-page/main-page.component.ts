import { Component, OnInit, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { AuthController } from 'isomorphic-lib/browser/controllers/AuthController';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class AppMainPageComponent implements OnInit {


  modalRef: BsModalRef;
  constructor(private modalService: BsModalService, public auth: AuthController) { }

  openModal(template: TemplateRef<any>) {
    console.log('open!!!');
    this.modalRef = this.modalService.show(template);
  }

  getAppHeight() {
    return window.outerHeight;
  }

  ngOnInit(): void {
    this.auth.isLoggedIn.subscribe(d => {
      if (this.modalRef) {
        this.modalRef.hide();
      }
    });
  }

}
