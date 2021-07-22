import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatViewComponent } from './components/chat-view/chat-view.component';



@NgModule({
  declarations: [ChatViewComponent],
  exports: [ChatViewComponent],
  imports: [
    CommonModule
  ]
})
export class ChatModule { }
