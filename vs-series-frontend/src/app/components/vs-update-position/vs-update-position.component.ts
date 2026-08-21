import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InputValidator } from '@universal-robots/ui-models';
import { VsUpdatePositionNode } from './vs-update-position.node';
import { VsProgramPresenterComponent } from '../vs-program-presenter.component';

@Component({
    templateUrl: './vs-update-position.component.html',
    styleUrls: ['./vs-update-position.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsUpdatePositionComponent extends VsProgramPresenterComponent<VsUpdatePositionNode> {
    toolNoValidators: InputValidator[] = [];

    saveToolNo(value: string | number): void {
        const toolNo = Number(value);
        if (!isValidToolNo(toolNo) || toolNo === this.contributedNode.parameters.toolNo) {
            return;
        }
        this.contributedNode.parameters.toolNo = toolNo;
        void this.saveNode();
    }

    protected override onTranslationsLoaded(): void {
        this.toolNoValidators = [
            (value) =>
                isValidToolNo(Number(value))
                    ? null
                    : this.translateService.instant('presenter.vs-update-position.validator.invalid_tool_no')
        ];
    }
}

const isValidToolNo = (value: number): boolean => Number.isInteger(value) && value >= 0;
