import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from './components/background/background.component';
import { TwitchService } from './services/twitch.service';



@NgModule({
  declarations: [
    BackgroundComponent
  ],
  exports: [
    BackgroundComponent
  ],
  providers: [TwitchService],
  imports: [
    CommonModule
  ]
})
export class SharedModule { }
