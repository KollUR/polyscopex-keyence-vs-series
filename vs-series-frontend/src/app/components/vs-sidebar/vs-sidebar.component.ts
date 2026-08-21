import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, InputSignal, OnDestroy } from '@angular/core';
import { RobotSettings, SidebarItemPresenter, SidebarPresenterAPI } from '@universal-robots/contribution-api';
import { TranslateService } from '@ngx-translate/core';
import { VsApplicationNode } from '../vs-application/vs-application.node';
import { VsBackendService } from '../../services/vs-backend.service';
import { VS_APPLICATION_NODE_TYPE, VS_REACHABILITY_POLL_MS } from '../../vs-series.constants';

interface SignalSidebarItemPresenter extends Omit<SidebarItemPresenter, 'robotSettings' | 'presenterAPI'> {
    robotSettings: InputSignal<RobotSettings | undefined>;
    presenterAPI: InputSignal<SidebarPresenterAPI | undefined>;
}

/**
 * Status only. This shows Reachable or Unreachable from a teach-time TCP check
 * and deliberately says nothing about whether a running program holds the
 * runtime CAM socket.
 */
@Component({
    templateUrl: './vs-sidebar.component.html',
    styleUrls: ['./vs-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsSidebarComponent implements SignalSidebarItemPresenter, OnDestroy {
    protected readonly translateService = inject(TranslateService);
    private readonly backend = inject(VsBackendService);
    private readonly cd = inject(ChangeDetectorRef);

    readonly robotSettings = input<RobotSettings | undefined>();
    readonly presenterAPI = input<SidebarPresenterAPI | undefined>();

    reachability: 'unknown' | 'reachable' | 'unreachable' = 'unknown';
    address = '';

    private baseUrl?: string;
    private pollHandle?: ReturnType<typeof setInterval>;

    readonly onLanguageChange = effect(() => {
        const language = this.robotSettings()?.language;
        if (language) {
            this.translateService.use(language);
        }
        this.translateService.setDefaultLang('en');
    });

    readonly onApiReady = effect(() => {
        const api = this.presenterAPI();
        if (!api) {
            return;
        }

        this.baseUrl = this.backend.resolveBaseUrl(api);
        this.startPolling(api);
    });

    ngOnDestroy(): void {
        this.stopPolling();
    }

    get reachabilityLabel(): string {
        switch (this.reachability) {
            case 'reachable':
                return this.translateService.instant('sidebar-items.keyence-vs-series-vs-sidebar.status.reachable');
            case 'unreachable':
                return this.translateService.instant('sidebar-items.keyence-vs-series-vs-sidebar.status.unreachable');
            default:
                return this.translateService.instant('sidebar-items.keyence-vs-series-vs-sidebar.status.unknown');
        }
    }

    get reachabilityTagType(): 'positive' | 'negative' | 'neutral' {
        switch (this.reachability) {
            case 'reachable':
                return 'positive';
            case 'unreachable':
                return 'negative';
            default:
                return 'neutral';
        }
    }

    /**
     * The interval is torn down with the component, so the VS Series is only
     * probed while the sidebar is actually open.
     */
    private startPolling(api: SidebarPresenterAPI): void {
        this.stopPolling();
        void this.poll(api);
        this.pollHandle = setInterval(() => void this.poll(api), VS_REACHABILITY_POLL_MS);
    }

    private stopPolling(): void {
        if (this.pollHandle) {
            clearInterval(this.pollHandle);
            this.pollHandle = undefined;
        }
    }

    private async poll(api: SidebarPresenterAPI): Promise<void> {
        if (!this.baseUrl || document.hidden) {
            return;
        }

        const settings = (await api.applicationService.getApplicationNode(VS_APPLICATION_NODE_TYPE)) as VsApplicationNode | undefined;
        if (!settings?.ipAddress) {
            this.reachability = 'unknown';
            this.address = '';
            this.cd.detectChanges();
            return;
        }

        this.address = `${settings.ipAddress}:${settings.port}`;
        const result = await this.backend.checkReachability(this.baseUrl, settings.ipAddress, settings.port);
        this.reachability = result.reachable ? 'reachable' : 'unreachable';
        this.cd.detectChanges();
    }
}
