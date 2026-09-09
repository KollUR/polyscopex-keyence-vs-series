/// <reference lib="webworker" />
import {
    AdvancedTranslatedProgramLabel,
    isVariableDeclaration,
    isVariableReference,
    OptionalPromise,
    ProgramBehaviors,
    ProgramNode,
    registerProgramBehavior,
    ScriptBuilder,
    ValidationContext,
    ValidationResponse,
    VariableService
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
        waitForReply: false,
        variable: null,
        variableName: ''
    }
});

async function resolveStringVariableName(node: VsCommandNode): Promise<string | undefined> {
    const entity = node.parameters?.variable;
    if (!entity) {
        return undefined;
    }

    if (isVariableDeclaration(entity)) {
        return entity.valueType === 'string' ? entity.name : undefined;
    }

    if (isVariableReference(entity)) {
        const desc = await new VariableService(self).getVariableDescription(entity);
        return desc?.valueType === 'string' ? desc.name : undefined;
    }

    return undefined;
}

/**
 * Sends one command through the preamble helpers. VS_socket_send_command appends
 * the CR, so the terminator stays defined in exactly one place.
 */
const generateScriptCodeBefore = async (node: VsCommandNode): Promise<ScriptBuilder> => {
    const builder = new ScriptBuilder();
    const command = node.parameters?.command?.trim();
    if (!command) {
        return builder;
    }

    builder.globalVariable('VS_Command', toUrScriptString(command));
    builder.addStatements('VS_socket_send_command(VS_SocketName)');

    if (node.parameters.waitForReply) {
        builder.addStatements('VS_socket_wait_react(VS_SocketName)');
        const variableName = await resolveStringVariableName(node);
        if (variableName) {
            builder.assign(variableName, 'VS_React');
        } else {
            builder.globalVariable('VS_LastReply', 'VS_React');
        }
    }

    return builder;
};

const validate = async (node: VsCommandNode, validationContext: ValidationContext): Promise<ValidationResponse> => {
    if (!node.parameters?.command?.trim()) {
        return { isValid: false, errorMessageKey: 'presenter.vs-command.validator.command_required' };
    }

    if (node.parameters.waitForReply && !(await resolveStringVariableName(node))) {
        return { isValid: false, errorMessageKey: 'presenter.vs-command.validator.variable_required' };
    }

    return { isValid: true };
};

const nodeUpgrade = (loadedNode: ProgramNode): ProgramNode => {
    const node = loadedNode as VsCommandNode;
    if (!node.parameters) {
        return loadedNode;
    }

    return {
        ...node,
        parameters: {
            command: node.parameters.command ?? '',
            waitForReply: node.parameters.waitForReply ?? true,
            variable: node.parameters.variable ?? null,
            variableName: node.parameters.variableName ?? ''
        }
    };
};

const behaviors: ProgramBehaviors = {
    programNodeLabel: createProgramNodeLabel,
    factory: createProgramNode,
    generateCodeBeforeChildren: generateScriptCodeBefore,
    validator: validate,
    upgradeNode: nodeUpgrade
};

registerProgramBehavior(behaviors);
