import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InputValidator } from '@universal-robots/ui-models';
import { VsCommandNode } from './vs-command.node';
import { VsProgramPresenterComponent } from '../vs-program-presenter.component';

@Component({
    templateUrl: './vs-command.component.html',
    styleUrls: ['./vs-command.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsCommandComponent extends VsProgramPresenterComponent<VsCommandNode> {
    commandValidators: InputValidator[] = [];

    /** The CR terminator is added at runtime, so the operator types the payload only. */
    saveCommand(value: string): void {
        const command = String(value ?? '').trim();
        if (command === this.contributedNode.parameters.command) {
            return;
        }
        this.contributedNode.parameters.command = command;
        void this.saveNode();
    }

    toggleWaitForReply(): void {
        this.contributedNode.parameters.waitForReply = !this.contributedNode.parameters.waitForReply;
        void this.saveNode();
    }

    protected override onTranslationsLoaded(): void {
        this.commandValidators = [
            (value) =>
                String(value ?? '').trim().length > 0
                    ? null
                    : this.translateService.instant('presenter.vs-command.validator.command_required')
        ];
    }
}
