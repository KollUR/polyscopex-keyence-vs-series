/// <reference lib="webworker" />
import {
    AdvancedTranslatedProgramLabel,
    OptionalPromise,
    ProgramBehaviors,
    ProgramNode,
    registerProgramBehavior,
    ScriptBuilder,
    ValidationContext,
    ValidationResponse
} from '@universal-robots/contribution-api';
import { VsCommandNode } from './vs-command.node';
import { toUrScriptString } from '../../urscript/vs-urscript-literal';

const createProgramNodeLabel = (node: VsCommandNode): AdvancedTranslatedProgramLabel => {
    const label: AdvancedTranslatedProgramLabel = [
        {
            type: 'primary',
            translationKey: 'program-node-labels.vs-command.nodeTitle'
        }
    ];

    const command = node.parameters?.command?.trim();
    if (command) {
        label.push({
            type: 'secondary',
            translationKey: 'program-node-labels.vs-command.commandValue',
            interpolateParams: { command }
        });
    }

    return label;
};

const createProgramNode = (): OptionalPromise<VsCommandNode> => ({
    type: 'keyence-vs-series-vs-command',
    version: '1.0.0',
    lockChildren: false,
    allowsChildren: false,
    parameters: {
        command: '',
        waitForReply: true
    }
});

/**
 * Sends one command through the preamble helpers. VS_socket_send_command appends
 * the CR, so the terminator stays defined in exactly one place.
 */
const generateScriptCodeBefore = (node: VsCommandNode): OptionalPromise<ScriptBuilder> => {
    const builder = new ScriptBuilder();
    const command = node.parameters?.command?.trim();
    if (!command) {
        return builder;
    }

    builder.globalVariable('VS_Command', toUrScriptString(command));
    builder.addStatements('VS_socket_send_command(VS_SocketName)');

    if (node.parameters.waitForReply) {
        builder.addStatements('VS_socket_wait_react(VS_SocketName)');
        builder.globalVariable('VS_LastReply', 'VS_React');
    }

    return builder;
};

const validate = (node: VsCommandNode, validationContext: ValidationContext): OptionalPromise<ValidationResponse> => {
    if (!node.parameters?.command?.trim()) {
        return { isValid: false, errorMessageKey: 'presenter.vs-command.validator.command_required' };
    }

    return { isValid: true };
};

const nodeUpgrade = (loadedNode: ProgramNode): ProgramNode => loadedNode;

const behaviors: ProgramBehaviors = {
    programNodeLabel: createProgramNodeLabel,
    factory: createProgramNode,
    generateCodeBeforeChildren: generateScriptCodeBefore,
    validator: validate,
    upgradeNode: nodeUpgrade
};

registerProgramBehavior(behaviors);
