import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon } from 'taon/src';

import type { Email } from './email';
import { EmailController } from './email.controller';

@Injectable()
export class EmailApiService extends Taon.Base.AngularService {
  private emailController: EmailController;

  public get allMyEntities$(): Observable<Email[]> {
    return this.emailController
      .getAll()
      .received.observable.pipe(map(res => res.body.json));
  }

  protected initControllers(): void {
    this.emailController = Taon.inject(() =>
      this.currentContext.getClass(EmailController),
    );
  }
}