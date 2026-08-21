import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ProgramNode, ProgramPresenter, ProgramPresenterAPI, RobotSettings } from '@universal-robots/contribution-api';
import { firstValueFrom } from 'rxjs';
import { VsApplicationNode } from './vs-application/vs-application.node';
import { VS_APPLICATION_NODE_TYPE } from '../vs-series.constants';

/**
 * Shared plumbing for the VS program node presenters: language handling, node
 * saving, and the info dialog that carries the explanatory copy which does not
 * fit in the single row PolyScope X gives a program node.
 */
@Component({
    template: '',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsProgramPresenterComponent<T extends ProgramNode = ProgramNode> implements OnChanges, ProgramPresenter {
    @Input() robotSettings: RobotSettings;
    @Input() contributedNode: T;

    private _presenterAPI: ProgramPresenterAPI;

    @Input()
    set presenterAPI(value: ProgramPresenterAPI) {
        this._presenterAPI = value;
        this.onPresenterAPIChanged();
    }

    get presenterAPI(): ProgramPresenterAPI {
        return this._presenterAPI;
    }

    protected readonly translateService = inject(TranslateService);
    protected readonly cd = inject(ChangeDetectorRef);

    /** Override to react when PolyScope assigns the API, which can happen outside ngOnChanges. */
    protected onPresenterAPIChanged(): void {
        // nothing by default
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (!changes?.robotSettings?.currentValue) {
            return;
        }

        if (changes.robotSettings.isFirstChange()) {
            this.translateService.setDefaultLang('en');
        }

        await firstValueFrom(this.translateService.use(changes.robotSettings.currentValue.language));
        this.onTranslationsLoaded();
        this.cd.detectChanges();
    }

    /** Override to rebuild anything produced with `translateService.instant`, such as validators. */
    protected onTranslationsLoaded(): void {
        // nothing to rebuild by default
    }

    async saveNode(): Promise<void> {
        this.cd.detectChanges();
        await this.presenterAPI.programNodeService.updateNode(this.contributedNode);
    }

    /** Shows the copy that used to sit under the controls as a stacked paragraph. */
    async openInfoDialog(titleKey: string, textKey: string): Promise<void> {
        await this.presenterAPI?.dialogService.openConfirmDialog(
            this.translateService.instant(titleKey),
            this.translateService.instant(textKey),
            'info'
        );
    }

    /** Program nodes never store the address themselves; they read the application node. */
    protected async getConnectionSettings(): Promise<VsApplicationNode | undefined> {
        if (!this.presenterAPI) {
            return undefined;
        }

        return (await this.presenterAPI.applicationService.getApplicationNode(VS_APPLICATION_NODE_TYPE)) as VsApplicationNode;
    }
}
