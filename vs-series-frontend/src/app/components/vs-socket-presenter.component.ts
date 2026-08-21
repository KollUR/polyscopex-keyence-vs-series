import { ChangeDetectionStrategy, Component, SimpleChanges } from '@angular/core';
import { ProgramNode } from '@universal-robots/contribution-api';
import { formatConnectionAddress } from './vs-application/vs-application.node';
import { VsProgramPresenterComponent } from './vs-program-presenter.component';

/**
 * Base for the Connect and Disconnect nodes. Neither takes a parameter, so the
 * row shows the address they act on. It is read-only here on purpose: the
 * address is owned by the VS Series application node.
 */
@Component({
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsSocketPresenterComponent<T extends ProgramNode = ProgramNode> extends VsProgramPresenterComponent<T> {
    address = '';

    protected override onPresenterAPIChanged(): void {
        void this.loadAddress();
    }

    override ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (this.presenterAPI) {
            void this.loadAddress();
        }

        return super.ngOnChanges(changes);
    }

    private async loadAddress(): Promise<void> {
        console.log('loadAddress');
        const settings = await this.getConnectionSettings();
        this.address = formatConnectionAddress(settings);
        this.cd.detectChanges();
    }
}
