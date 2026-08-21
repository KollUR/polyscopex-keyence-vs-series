import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VsDisconnectNode } from './vs-disconnect.node';
import { VsSocketPresenterComponent } from '../vs-socket-presenter.component';

@Component({
    templateUrl: './vs-disconnect.component.html',
    styleUrls: ['./vs-disconnect.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsDisconnectComponent extends VsSocketPresenterComponent<VsDisconnectNode> {}
