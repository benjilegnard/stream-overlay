import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppModule } from './app.module';

@NgModule({
  imports: [AppModule],
  providers: [
    {
      provide: 'ENV_CONFIG_SSR',
      useValue: undefined,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppBrowserModule {}
