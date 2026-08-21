import { TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs/operators';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChanges
} from '@angular/core';
import { ApplicationPresenterAPI, ApplicationPresenter, RobotSettings } from '@universal-robots/contribution-api';
import { InputValidator } from '@universal-robots/ui-models';
import { VsApplicationNode } from './vs-application.node';
import { VsBackendService } from '../../services/vs-backend.service';
import { VS_REACHABILITY_POLL_MS } from '../../vs-series.constants';

type Reachability = 'unknown' | 'reachable' | 'unreachable';

@Component({
    templateUrl: './vs-application.component.html',
    styleUrls: ['./vs-application.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class VsApplicationComponent implements ApplicationPresenter, OnChanges, OnDestroy {
    @Input() applicationAPI: ApplicationPresenterAPI;
    @Input() robotSettings: RobotSettings;
    @Input() applicationNode: VsApplicationNode;

    /** Teach-time state. None of this is persisted and none of it means program-connected. */
    reachability: Reachability = 'unknown';
    teachTimeConnected = false;
    lastTestMessage = '';
    busy = false;

    ipAddressValidators: InputValidator[] = [];
    portValidators: InputValidator[] = [];

    private baseUrl?: string;
    private pollHandle?: ReturnType<typeof setInterval>;

    constructor(
        protected readonly translateService: TranslateService,
        protected readonly cd: ChangeDetectorRef,
        private readonly backend: VsBackendService
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.robotSettings) {
            if (!changes?.robotSettings?.currentValue) {
                return;
            }

            if (changes?.robotSettings?.isFirstChange()) {
                if (changes?.robotSettings?.currentValue) {
                    this.translateService.use(changes?.robotSettings?.currentValue?.language);
                }
                this.translateService.setDefaultLang('en');
            }

            this.translateService
                .use(changes?.robotSettings?.currentValue?.language)
                .pipe(first())
                .subscribe(() => {
                    this.updateValidators();
                    this.cd.detectChanges();
                });
        }

        if (changes?.applicationAPI?.currentValue && !this.baseUrl) {
            this.baseUrl = this.backend.resolveBaseUrl(this.applicationAPI);
            this.startPolling();
        }
    }

    ngOnDestroy(): void {
        this.stopPolling();
    }

    /** Sidebar and this screen say Reachable or Unreachable, never Connected. */
    get reachabilityLabel(): string {
        switch (this.reachability) {
            case 'reachable':
                return this.translateService.instant('presenter.vs-application.status.reachable');
            case 'unreachable':
                return this.translateService.instant('presenter.vs-application.status.unreachable');
            default:
                return this.translateService.instant('presenter.vs-application.status.unknown');
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

    saveIpAddress(value: string): void {
        const ipAddress = value.trim();
        if (!isValidIpAddress(ipAddress) || ipAddress === this.applicationNode.ipAddress) {
            return;
        }
        this.applicationNode.ipAddress = ipAddress;
        this.saveNode();
        this.resetTeachTimeState();
    }

    savePort(value: string): void {
        const port = Number(value);
        if (!isValidPort(port) || port === this.applicationNode.port) {
            return;
        }
        this.applicationNode.port = port;
        this.saveNode();
        this.resetTeachTimeState();
    }

    /** Manual connection test. Corresponds to the PolyScope 5 SocketVSCom check. */
    async test(): Promise<void> {
        if (!this.baseUrl) {
            return;
        }

        this.busy = true;
        this.cd.detectChanges();

        const result = await this.backend.checkReachability(this.baseUrl, this.applicationNode.ipAddress, this.applicationNode.port);
        this.reachability = result.reachable ? 'reachable' : 'unreachable';
        this.lastTestMessage = result.reachable
            ? this.translateService.instant('presenter.vs-application.message.test_succeeded', {
                  address: `${this.applicationNode.ipAddress}:${this.applicationNode.port}`
              })
            : this.translateService.instant('presenter.vs-application.message.test_failed', { reason: result.error ?? '' });
        this.busy = false;
        this.cd.detectChanges();
    }

    /** Calibration Connect. Holds a teach-time socket open; drives no robot motion. */
    async calibrationConnect(): Promise<void> {
        if (!this.baseUrl) {
            return;
        }

        this.busy = true;
        this.cd.detectChanges();

        const result = await this.backend.connect(this.baseUrl, this.applicationNode.ipAddress, this.applicationNode.port);
        this.teachTimeConnected = result.connected;
        if (result.connected) {
            this.reachability = 'reachable';
            this.lastTestMessage = this.translateService.instant('presenter.vs-application.message.calibration_connected');
        } else {
            this.lastTestMessage = this.translateService.instant('presenter.vs-application.message.calibration_failed', {
                reason: result.error ?? ''
            });
        }
        this.busy = false;
        this.cd.detectChanges();
    }

    async calibrationDisconnect(): Promise<void> {
        if (!this.baseUrl) {
            return;
        }

        this.busy = true;
        this.cd.detectChanges();

        await this.backend.disconnect(this.baseUrl);
        this.teachTimeConnected = false;
        this.lastTestMessage = this.translateService.instant('presenter.vs-application.message.calibration_disconnected');
        this.busy = false;
        this.cd.detectChanges();
    }

    saveNode(): void {
        this.cd.detectChanges();
        this.applicationAPI.applicationNodeService.updateNode(this.applicationNode);
    }

    /** Polling stops with the component, so it runs only while this screen is open. */
    private startPolling(): void {
        this.stopPolling();
        void this.poll();
        this.pollHandle = setInterval(() => void this.poll(), VS_REACHABILITY_POLL_MS);
    }

    private stopPolling(): void {
        if (this.pollHandle) {
            clearInterval(this.pollHandle);
            this.pollHandle = undefined;
        }
    }

    private async poll(): Promise<void> {
        if (!this.baseUrl || !this.applicationNode || document.hidden || this.busy) {
            return;
        }

        const result = await this.backend.checkReachability(this.baseUrl, this.applicationNode.ipAddress, this.applicationNode.port);
        this.reachability = result.reachable ? 'reachable' : 'unreachable';
        this.cd.detectChanges();
    }

    private resetTeachTimeState(): void {
        this.reachability = 'unknown';
        this.lastTestMessage = '';
    }

    private updateValidators(): void {
        this.ipAddressValidators = [
            (value) =>
                isValidIpAddress(String(value))
                    ? null
                    : this.translateService.instant('presenter.vs-application.validator.invalid_ip_address')
        ];
        this.portValidators = [
            (value) =>
                isValidPort(Number(value)) ? null : this.translateService.instant('presenter.vs-application.validator.invalid_port')
        ];
    }
}

const isValidIpAddress = (value: string): boolean => {
    const octets = value.split('.');
    if (octets.length !== 4) {
        return false;
    }
    return octets.every((octet) => /^\d{1,3}$/.test(octet) && Number(octet) <= 255);
};

const isValidPort = (value: number): boolean => Number.isInteger(value) && value > 0 && value <= 65535;
