import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import {
    isVariableDeclaration,
    isVariableReference,
    VariableDescriptionWithReference,
} from '@universal-robots/contribution-api';
import { DropdownOption, InputValidator } from '@universal-robots/ui-models';
import { Subscription } from 'rxjs';
import { VsCommandNode } from './vs-command.node';
import { VsProgramPresenterComponent } from '../vs-program-presenter.component';

@Component({
    templateUrl: './vs-command.component.html',
    styleUrls: ['./vs-command.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsCommandComponent extends VsProgramPresenterComponent<VsCommandNode> implements OnDestroy {
    commandValidators: InputValidator[] = [];
    variableValidators: InputValidator<string>[] = [];

    variableOptions: DropdownOption[] = [];
    createError: string | null = null;

    private allVariables: VariableDescriptionWithReference[] = [];
    private variablesSub?: Subscription;

    /** The CR terminator is added at runtime, so the operator types the payload only. */
    saveCommand(value: string): void {
        const command = String(value ?? '').trim();
        if (command === this.contributedNode.parameters.command) {
            return;
        }
        this.contributedNode.parameters.command = command;
        void this.saveNode();
    }

    override onPresenterAPIChanged(): void {
        this.subscribeVariables();
    }

    ngOnDestroy(): void {
        this.variablesSub?.unsubscribe();
    }

    async onVariableSelectionChange($event: DropdownOption | string): Promise<void> {
        this.createError = null;
        const name = this.resolveOptionName($event);
        if (!name || name === this.contributedNode.parameters.variableName) {
            return;
        }

        const selected = this.allVariables.find((v) => v.name === name);
        if (!selected) {
            return;
        }

        this.contributedNode.parameters.variable = { ...selected.reference };
        this.contributedNode.parameters.variableName = selected.name;
        await this.saveNode();
    }

    async onVariableOptionAdd($event: string | DropdownOption): Promise<void> {
        this.createError = null;
        const name = (typeof $event === 'string' ? $event : $event?.label ?? '').trim();
        if (!name) {
            return;
        }

        try {
            const declaration = await this.presenterAPI.variableService.createVariable(name, 'string');
            this.contributedNode.parameters.variable = declaration;
            this.contributedNode.parameters.variableName = declaration.name;
            await this.saveNode();
        } catch (err) {
            this.createError = this.translateService.instant('presenter.vs-command.error.create_variable', {
                message: err instanceof Error ? err.message : String(err)
            });
            this.cd.detectChanges();
        }
    }

    toggleWaitForReply(): void {
        this.contributedNode.parameters.waitForReply = !this.contributedNode.parameters.waitForReply;

        if (!this.contributedNode.parameters.waitForReply) {
            this.contributedNode.parameters.variable = null;
            this.contributedNode.parameters.variableName = '';
        }

        void this.saveNode();
    }

    /** Empty while Wait for reply is off so the dropdown shows its placeholder. */
    get selectedVariableOption(): string | undefined {
        if (!this.contributedNode?.parameters?.waitForReply) {
            return undefined;
        }

        const name = this.contributedNode.parameters.variableName?.trim();
        return name || undefined;
    }

    protected override onTranslationsLoaded(): void {
        this.commandValidators = [
            (value) =>
                String(value ?? '').trim().length > 0
                    ? null
                    : this.translateService.instant('presenter.vs-command.validator.command_required')
        ];

        this.variableValidators = [(value) => this.validateVariableName(value)];
    }

    /** Load options from VariableService.variables(). */
    private subscribeVariables(): void {
        if (!this.presenterAPI) {
            return;
        }

        this.variablesSub?.unsubscribe();
        this.variablesSub = this.presenterAPI.variableService.variables().subscribe((variables) => {
            this.allVariables = variables
                .filter((v) => !v.isDeleted && v.valueType === 'string')
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

            this.variableOptions = this.allVariables.map((v) => ({
                label: v.name,
                value: v.name,
                invalid: v.programNodeMetadata?.isSuppressed
            }));

            void this.syncSelectedVariableName();
            this.cd.detectChanges();
        });
    }

    private async syncSelectedVariableName(): Promise<void> {
        if (!this.contributedNode.parameters.waitForReply) {
            if (this.contributedNode.parameters.variable || this.contributedNode.parameters.variableName) {
                this.contributedNode.parameters.variable = null;
                this.contributedNode.parameters.variableName = '';
                await this.saveNode();
            }
            return;
        }

        const entity = this.contributedNode?.parameters?.variable;
        if (!entity) {
            return;
        }

        if (isVariableDeclaration(entity)) {
            if (entity.valueType !== 'string') {
                await this.clearVariableSelection();
                return;
            }
            this.contributedNode.parameters.variableName = entity.name;
            return;
        }

        if (isVariableReference(entity)) {
            const desc = await this.presenterAPI.variableService.getVariableDescription(entity);
            if (!desc?.name || desc.valueType !== 'string') {
                await this.clearVariableSelection();
                return;
            }
            this.contributedNode.parameters.variableName = desc.name;
        }
    }

    private async clearVariableSelection(): Promise<void> {
        if (!this.contributedNode.parameters.variable && !this.contributedNode.parameters.variableName) {
            return;
        }

        this.contributedNode.parameters.variable = null;
        this.contributedNode.parameters.variableName = '';
        await this.saveNode();
    }

    private async validateVariableName(value: string): Promise<string | null> {
        const name = value?.trim() ?? '';
        if (!name) {
            return this.translateService.instant('presenter.vs-command.validator.variable_required');
        }
        if (!/^[a-zA-Z]+\w*$/.test(name)) {
            return this.translateService.instant('presenter.vs-command.validator.variable_name_invalid');
        }
        const ownName = this.contributedNode?.parameters?.variableName;
        if (name !== ownName && (await this.presenterAPI?.symbolService?.isRegisteredVariableName(name))) {
            return this.translateService.instant('presenter.vs-command.validator.variable_name_exists');
        }
        return null;
    }

    private resolveOptionName($event: DropdownOption | string): string {
        if (typeof $event === 'string') {
            return $event.trim();
        }

        return String($event?.label ?? $event?.value ?? '').trim();
    }
}
