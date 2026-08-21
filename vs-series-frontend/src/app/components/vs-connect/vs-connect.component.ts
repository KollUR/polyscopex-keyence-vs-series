import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VsConnectNode } from './vs-connect.node';
import { VsSocketPresenterComponent } from '../vs-socket-presenter.component';

@Component({
    templateUrl: './vs-connect.component.html',
    styleUrls: ['./vs-connect.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsConnectComponent extends VsSocketPresenterComponent<VsConnectNode> {
}
