import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from './components/background/background.component';



@NgModule({
  declarations: [
    BackgroundComponent
  ],
  exports: [
    BackgroundComponent
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule { }
