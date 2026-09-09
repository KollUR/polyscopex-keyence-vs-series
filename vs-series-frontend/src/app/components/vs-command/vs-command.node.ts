import { ProgramNode, VariableDeclaration, VariableReference } from '@universal-robots/contribution-api';

export interface VsCommandParameters {
    /** ASCII command sent to the VS Series. The terminating CR is added at runtime. */
    command: string;
    /** Wait for the reply and keep it in the selected variable. */
    waitForReply: boolean;
    /** Program variable that receives the reply when waitForReply is enabled. */
    variable: VariableReference | VariableDeclaration | null;
    /** Cached display name for the dropdown and generated script. */
    variableName: string;
}

export interface VsCommandNode extends ProgramNode {
    type: string;
    parameters: VsCommandParameters;
    lockChildren?: boolean;
    allowsChildren?: boolean;
}
