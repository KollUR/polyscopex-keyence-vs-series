/// <reference lib="webworker" />
import {
    AdvancedTranslatedProgramLabel,
    OptionalPromise,
    ProgramBehaviorAPI,
    ProgramBehaviors,
    ProgramNode,
    registerProgramBehavior,
    ScriptBuilder,
    ValidationContext,
    ValidationResponse
} from '@universal-robots/contribution-api';
import { VsDisconnectNode } from './vs-disconnect.node';
import { formatConnectionAddress, VsApplicationNode } from '../vs-application/vs-application.node';
import { VS_APPLICATION_NODE_TYPE } from 'src/app/vs-series.constants';

const getConnectionSettings = async (): Promise<VsApplicationNode> => {
    const api = new ProgramBehaviorAPI(self);
    return (await api.applicationService.getApplicationNode(VS_APPLICATION_NODE_TYPE)) as VsApplicationNode;
};

const createProgramNodeLabel = async (node: VsDisconnectNode): Promise<AdvancedTranslatedProgramLabel> => {
    const address = formatConnectionAddress(await getConnectionSettings());
    const label: AdvancedTranslatedProgramLabel = [  
        {
            type: 'secondary',
            translationKey: 'program-node-labels.vs-disconnect.addressValue',
            interpolateParams: { address }
        }
    ];
    return label;
};

const createProgramNode = (): OptionalPromise<VsDisconnectNode> => ({
    type: 'keyence-vs-series-vs-disconnect',
    version: '1.0.0',
    lockChildren: false,
    allowsChildren: false,
    parameters: {}
});

// Closes the runtime CAM socket. The teach-time socket in the Docker backend is
// a different connection and is unaffected.
const generateScriptCodeBefore = (node: VsDisconnectNode): OptionalPromise<ScriptBuilder> =>
    new ScriptBuilder().addStatements('KeyClose()');

const validate = (node: VsDisconnectNode, validationContext: ValidationContext): OptionalPromise<ValidationResponse> => ({
    isValid: true
});

const nodeUpgrade = (loadedNode: ProgramNode): ProgramNode => loadedNode;

const behaviors: ProgramBehaviors = {
    programNodeLabel: createProgramNodeLabel,
    factory: createProgramNode,
    generateCodeBeforeChildren: generateScriptCodeBefore,
    validator: validate,
    upgradeNode: nodeUpgrade
};

registerProgramBehavior(behaviors);

