import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[firedevInjectHTML]',
  standalone: true,
})
export class FiredevInjectHTMLDirective {
  @Input() set firedevInjectHTML(content: string) {
    this.host.nativeElement.innerHTML = content;
  }

  constructor(private host: ElementRef) {}
}
