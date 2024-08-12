import { NgModule } from "@angular/core";
import { SubscriberInjectComponent } from "./user.component";
import { CommonModule } from "@angular/common";

@NgModule({
  exports: [SubscriberInjectComponent],
  imports: [CommonModule],
  declarations: [SubscriberInjectComponent],
})
export class SubscriberInjectModule {}
