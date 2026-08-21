import { ProgramNode } from '@universal-robots/contribution-api';

export interface VsCommandParameters {
    /** ASCII command sent to the VS Series. The terminating CR is added at runtime. */
    command: string;
    /** Wait for the reply and keep it in VS_LastReply. */
    waitForReply: boolean;
}

export interface VsCommandNode extends ProgramNode {
    type: string;
    parameters: VsCommandParameters;
    lockChildren?: boolean;
    allowsChildren?: boolean;
}
