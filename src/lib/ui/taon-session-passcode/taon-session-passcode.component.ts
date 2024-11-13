import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  Input,
  OnInit,
  Self,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { Stor } from 'taon-storage/src';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { interval, take, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface TaonSessionPasscodeModel {
  passcode: string;
}

export type TaonSessionPasscodeForm = {
  [prop in keyof TaonSessionPasscodeModel]: FormControl<
    TaonSessionPasscodeModel[prop]
  >;
};

@Component({
  selector: 'taon-session-passcode',
  templateUrl: './taon-session-passcode.component.html',
  styleUrls: ['./taon-session-passcode.component.scss'],
  standalone: true,
  imports: [PasswordModule, CommonModule, ReactiveFormsModule, FormsModule],
})
export class TaonSessionPasscodeComponent implements OnInit {
  destroyRef = inject(DestroyRef);
  // @HostBinding('style.width.px') public width: number;
  // @HostBinding('style.height.px') public height: number;
  @Input() public passcode: string;
  @Input() public message: string;
  public safeMessage: SafeHtml;

  @(Stor.property.in.localstorage
    .for(TaonSessionPasscodeComponent)
    .withDefaultValue(''))
  private lastPasscode: string;
  @HostBinding('style.display') public display = 'none';
  public form: FormGroup<TaonSessionPasscodeForm> =
    new FormGroup<TaonSessionPasscodeForm>({
      passcode: new FormControl(),
    });
  constructor(
    @Self() private element: ElementRef<HTMLElement>,
    private domSanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    if (!this.passcode) {
      this.passcode = '123456';
    }
    if (!this.message) {
      this.message = `
      This website is only for testing purpose. Please type passcode bellow to see content.

      `;
    }
    // console.log({
    //   'lastPasscode': this.lastPasscode,
    //   'current passcode': this.passcode,
    //   'current message': this.message,
    // })
    // this.width = window.innerWidth;
    // this.height = window.innerHeight;
    this.safeMessage = this.domSanitizer.bypassSecurityTrustHtml(this.message);

    if (this.lastPasscode?.toString() === this.passcode?.toString()) {
      this.hide();
    } else {
      this.show();
      this.focus();
    }

    interval(1000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => {
          this.focus();
        }),
      )
      .subscribe();
  }

  submit({ passcode }: Partial<TaonSessionPasscodeModel>) {
    if (this.isPasscodeOK(passcode || '')) {
      this.hide();
    } else {
      this.clear();
    }
  }

  private isPasscodeOK(passcode: string) {
    this.lastPasscode = passcode.toString();
    return this.passcode.toString() === passcode;
  }

  ngAfterViewInit(): void {}

  public focus(): void {
    this.element.nativeElement.querySelector('input')?.focus();
  }

  hide() {
    this.display = 'none';
  }

  show() {
    this.display = 'block';
  }

  clear() {
    this.form.controls.passcode.setValue('');
  }

  onKeyup(event: KeyboardEvent & { target: { value: string } }) {
    if (this.isPasscodeOK(event.target.value || '')) {
      this.hide();
      return;
    }
    const key = event.keyCode || event.charCode;
    if (key === 8 || key === 46 || this.lastPasscode?.length > 5) {
      this.clear();
    }
  }
}
