import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { VsApplicationComponent } from './components/vs-application/vs-application.component';
import { VsConnectComponent } from './components/vs-connect/vs-connect.component';
import { VsDisconnectComponent } from './components/vs-disconnect/vs-disconnect.component';
import { VsCommandComponent } from './components/vs-command/vs-command.component';
import { VsUpdatePositionComponent } from './components/vs-update-position/vs-update-position.component';
import { VsSidebarComponent } from './components/vs-sidebar/vs-sidebar.component';

import { UIAngularComponentsModule } from '@universal-robots/ui-angular-components';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { HttpBackend, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {MultiTranslateHttpLoader} from 'ngx-translate-multi-http-loader';
import { PATH } from '../generated/contribution-constants';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

export const httpLoaderFactory = (http: HttpBackend) =>
    new MultiTranslateHttpLoader(http, [
      { prefix: PATH + '/assets/i18n/', suffix: '.json' },
      { prefix: './ui/assets/i18n/', suffix: '.json' },
    ]);

@NgModule({

  declarations: [
      VsApplicationComponent,
      VsConnectComponent,
      VsDisconnectComponent,
      VsCommandComponent,
      VsUpdatePositionComponent,
      VsSidebarComponent
],
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      UIAngularComponentsModule,
      HttpClientModule,
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useFactory: httpLoaderFactory, deps: [HttpBackend] },
        useDefaultLang: false,
      })
    ],
    providers: [],
})

export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) {
  }

  ngDoBootstrap() {
    const vsapplicationComponent = createCustomElement(VsApplicationComponent, {injector: this.injector});
    customElements.define('keyence-vs-series-vs-application', vsapplicationComponent);
    const vsconnectComponent = createCustomElement(VsConnectComponent, {injector: this.injector});
    customElements.define('keyence-vs-series-vs-connect', vsconnectComponent);
    const vsdisconnectComponent = createCustomElement(VsDisconnectComponent, {injector: this.injector});
    customElements.define('keyence-vs-series-vs-disconnect', vsdisconnectComponent);
    const vscommandComponent = createCustomElement(VsCommandComponent, {injector: this.injector});
    customElements.define('keyence-vs-series-vs-command', vscommandComponent);
    const vsupdatepositionComponent = createCustomElement(VsUpdatePositionComponent, {injector: this.injector});
    customElements.define('keyence-vs-series-vs-update-position', vsupdatepositionComponent);
    const vssidebarComponent = createCustomElement(VsSidebarComponent, {injector: this.injector});
    customElements.define('keyence-vs-series-vs-sidebar', vssidebarComponent);
  }

  // This function is never called, because we don't want to actually use the workers, just tell webpack about them
  registerWorkersWithWebPack() {
    new Worker(new URL('./components/vs-application/vs-application.behavior.worker.ts'
        /* webpackChunkName: "vs-application.worker" */, import.meta.url), {
      name: 'vs-application',
      type: 'module'
    });new Worker(new URL('./components/vs-connect/vs-connect.behavior.worker.ts'
        /* webpackChunkName: "vs-connect.worker" */, import.meta.url), {
      name: 'vs-connect',
      type: 'module'
    });new Worker(new URL('./components/vs-disconnect/vs-disconnect.behavior.worker.ts'
        /* webpackChunkName: "vs-disconnect.worker" */, import.meta.url), {
      name: 'vs-disconnect',
      type: 'module'
    });new Worker(new URL('./components/vs-command/vs-command.behavior.worker.ts'
        /* webpackChunkName: "vs-command.worker" */, import.meta.url), {
      name: 'vs-command',
      type: 'module'
    });new Worker(new URL('./components/vs-update-position/vs-update-position.behavior.worker.ts'
        /* webpackChunkName: "vs-update-position.worker" */, import.meta.url), {
      name: 'vs-update-position',
      type: 'module'
    });new Worker(new URL('./components/vs-sidebar/vs-sidebar.behavior.worker.ts'
        /* webpackChunkName: "vs-sidebar.worker" */, import.meta.url), {
      name: 'vs-sidebar',
      type: 'module'
    });
  }
}

