import { ApplicationNode } from '@universal-robots/contribution-api';

/**
 * Connection settings for the VS Series. These two fields are the only
 * persisted state in the PoC; program nodes read them at generate time rather
 * than carrying their own copy.
 */
export interface VsApplicationNode extends ApplicationNode {
    type: string;
    version: string;
    ipAddress: string;
    port: number;
}

/** Presenter and program-node labels both show this; keep the format in one place. */
export const formatConnectionAddress = (settings?: Pick<VsApplicationNode, 'ipAddress' | 'port'> | null): string =>
    settings?.ipAddress ? `${settings.ipAddress}:${settings.port}` : '';
