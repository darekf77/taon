import {
  Directive,
  Input,
  Output,
  EventEmitter,
  HostBinding,
  HostListener,
} from '@angular/core';

import { _ } from 'tnp-core/src';
import { Log, Level } from 'ng2-logger/src';
const log = Log.create(`[taon-helpers] long-press`, Level.__NOTHING);

@Directive({
  selector: '[taonLongPress]',
  standalone: true,
})
export class TaonLongPress {
  @Input() pressDuration: number = 1000;

  @Output() onLongPress: EventEmitter<any> = new EventEmitter();
  @Output() onLongPressing: EventEmitter<any> = new EventEmitter();
  @Output() onLongPressEnd: EventEmitter<any> = new EventEmitter();

  private pressing: boolean;
  private longPressing: boolean;
  private timeout: any;
  private mouseX: number = 0;
  private mouseY: number = 0;

  @HostBinding('class.press')
  get press() {
    return this.pressing;
  }

  @HostBinding('class.longpress')
  get longPress() {
    return this.longPressing;
  }

  allowTrigger = false;
  triggerEnd = _.debounce(() => {
    this.endPress();
  }, 500);

  @HostListener('mousedown', ['$event'])
  onMouseDown(event) {
    // don't do right/middle clicks
    log.d(`MOUSE DOWN `);

    if (event.which !== 1) return;
    this.allowTrigger = true;

    this.mouseX = event.clientX;
    this.mouseY = event.clientY;

    this.pressing = true;
    this.longPressing = false;

    this.timeout = setTimeout(() => {
      if (this.allowTrigger) {
        this.longPressing = true;
        log.d(`long pressing start  pressDuration:${this.pressDuration} `);
        this.onLongPress.emit(event);
        this.loop(event);
      }
    }, this.pressDuration);

    this.loop(event);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event) {
    if (this.pressing && !this.longPressing) {
      const xThres = event.clientX - this.mouseX > 10;
      const yThres = event.clientY - this.mouseY > 10;
      if (xThres || yThres) {
        this.endPress();
      }
    }
  }

  loop(event) {
    if (this.longPressing) {
      this.timeout = setTimeout(() => {
        log.d(`emil longpressing`);
        this.triggerEnd();
        this.onLongPressing.emit(event);
        this.loop(event);
      }, 50);
    }
  }

  endPress(emit = true) {
    this.allowTrigger = false;
    clearTimeout(this.timeout);
    this.longPressing = false;
    this.pressing = false;
    if (emit) {
      log.d(`EMIT END`);
      this.onLongPressEnd.emit(true);
    } else {
      log.d(`NOT EMIT END`);
    }
  }

  @HostListener('mouseup')
  onMouseUp() {
    this.endPress(false);
  }
}
