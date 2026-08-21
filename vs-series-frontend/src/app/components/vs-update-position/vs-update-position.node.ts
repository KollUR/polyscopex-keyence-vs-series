import { ProgramNode } from '@universal-robots/contribution-api';

export interface VsUpdatePositionParameters {
    /** VS Series tool number the capture position is stored against. */
    toolNo: number;
}

export interface VsUpdatePositionNode extends ProgramNode {
    type: string;
    parameters: VsUpdatePositionParameters;
    lockChildren?: boolean;
    allowsChildren?: boolean;
}
