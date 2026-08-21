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
import { VsUpdatePositionNode } from './vs-update-position.node';
import { VS_DEFAULT_TOOL_NO } from '../../vs-series.constants';

const createProgramNodeLabel = (node: VsUpdatePositionNode): AdvancedTranslatedProgramLabel => [
    {
        type: 'primary',
        translationKey: 'program-node-labels.vs-update-position.nodeTitle'
    },
    {
        type: 'secondary',
        translationKey: 'program-node-labels.vs-update-position.toolValue',
        interpolateParams: { toolNo: String(node.parameters?.toolNo ?? VS_DEFAULT_TOOL_NO) }
    }
];

const createProgramNode = (): OptionalPromise<VsUpdatePositionNode> => ({
    type: 'keyence-vs-series-vs-update-position',
    version: '1.0.0',
    lockChildren: false,
    allowsChildren: false,
    parameters: {
        toolNo: VS_DEFAULT_TOOL_NO
    }
});

/**
 * Registers the current TCP pose as the capture position. The unit and rotation
 * conversion (UR rotvec/m/rad to VS RPY/mm/deg) lives in KeyGetCurrentPose, so
 * this node must not convert anything itself.
 */
const generateScriptCodeBefore = (node: VsUpdatePositionNode): OptionalPromise<ScriptBuilder> =>
    new ScriptBuilder().addStatements(`KeySendCommand_RBCPW(${node.parameters?.toolNo ?? VS_DEFAULT_TOOL_NO}, KeyGetCurrentPose())`);

const validate = (node: VsUpdatePositionNode, validationContext: ValidationContext): OptionalPromise<ValidationResponse> => {
    const toolNo = node.parameters?.toolNo;
    if (!Number.isInteger(toolNo) || (toolNo as number) < 0) {
        return { isValid: false, errorMessageKey: 'presenter.vs-update-position.validator.invalid_tool_no' };
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
