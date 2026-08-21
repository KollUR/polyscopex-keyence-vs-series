import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { URCAP_ID, VENDOR_ID } from '../../generated/contribution-constants';
import { VS_BACKEND_CONTAINER_ID, VS_BACKEND_INGRESS_ID } from '../vs-series.constants';

/** Structural type satisfied by both ApplicationPresenterAPI and SidebarPresenterAPI. */
export interface ContainerUrlProvider {
    getContainerContributionURL(vendorId: string, urcapId: string, containerName: string, serviceName: string): string;
}

export interface ReachabilityResult {
    reachable: boolean;
    error: string | null;
}

export interface TeachTimeConnectionResult {
    connected: boolean;
    error: string | null;
}

/**
 * Talks to the container contribution that owns the teach-time TCP channel.
 * Nothing here touches the runtime CAM socket, which lives in URScript.
 */
@Injectable({ providedIn: 'root' })
export class VsBackendService {
    private readonly httpClient = inject(HttpClient);

    resolveBaseUrl(api: ContainerUrlProvider): string {
        // getContainerContributionURL returns a URL without a protocol.
        const url = api.getContainerContributionURL(VENDOR_ID, URCAP_ID, VS_BACKEND_CONTAINER_ID, VS_BACKEND_INGRESS_ID);
        return `${location.protocol}//${url}`;
    }

    async checkReachability(baseUrl: string, ipAddress: string, port: number): Promise<ReachabilityResult> {
        const params = { host: ipAddress, port: String(port) };
        try {
            return await firstValueFrom(this.httpClient.get<ReachabilityResult>(`${baseUrl}/reachability`, { params }));
        } catch (error) {
            return { reachable: false, error: describe(error) };
        }
    }

    async connect(baseUrl: string, ipAddress: string, port: number): Promise<TeachTimeConnectionResult> {
        try {
            return await firstValueFrom(
                this.httpClient.post<TeachTimeConnectionResult>(`${baseUrl}/connect`, { host: ipAddress, port })
            );
        } catch (error) {
            return { connected: false, error: describe(error) };
        }
    }

    async disconnect(baseUrl: string): Promise<TeachTimeConnectionResult> {
        try {
            return await firstValueFrom(this.httpClient.post<TeachTimeConnectionResult>(`${baseUrl}/disconnect`, {}));
        } catch (error) {
            return { connected: false, error: describe(error) };
        }
    }
}

/**
 * A failure to reach the container is reported the same way as a failure to
 * reach the VS Series, so the operator is never left without a reason.
 */
const describe = (error: unknown): string => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message: unknown }).message);
    }
    return String(error);
};
