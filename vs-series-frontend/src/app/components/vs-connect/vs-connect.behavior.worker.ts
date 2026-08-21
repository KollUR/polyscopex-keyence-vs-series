/// <reference lib="webworker" />
import {
    AdvancedTranslatedProgramLabel,
    OptionalPromise,
    PopupLevel,
    ProgramBehaviorAPI,
    ProgramBehaviors,
    ProgramNode,
    registerProgramBehavior,
    ScriptBuilder,
    ValidationContext,
    ValidationResponse
} from '@universal-robots/contribution-api';
import { VsConnectNode } from './vs-connect.node';
import { formatConnectionAddress, VsApplicationNode } from '../vs-application/vs-application.node';
import { VS_APPLICATION_NODE_TYPE } from '../../vs-series.constants';
import { toUrScriptString } from '../../urscript/vs-urscript-literal';

const getConnectionSettings = async (): Promise<VsApplicationNode> => {
    const api = new ProgramBehaviorAPI(self);
    return (await api.applicationService.getApplicationNode(VS_APPLICATION_NODE_TYPE)) as VsApplicationNode;
};

const createProgramNodeLabel = async (node: VsConnectNode): Promise<AdvancedTranslatedProgramLabel> => {
    const address = formatConnectionAddress(await getConnectionSettings());
    const label: AdvancedTranslatedProgramLabel = [  
        {
            type: 'secondary',
            translationKey: 'program-node-labels.vs-connect.addressValue',
            interpolateParams: { address }
        }
];
    return label;
};

const createProgramNode = (): OptionalPromise<VsConnectNode> => ({
    type: 'keyence-vs-series-vs-connect',
    version: '1.0.0',
    lockChildren: false,
    allowsChildren: false,
    parameters: {}
});

/**
 * The node carries no IP or port of its own; it reads the application node at
 * generate time, so changing the settings is enough to retarget every program.
 */
const generateScriptCodeBefore = async (node: VsConnectNode): Promise<ScriptBuilder> => {
    const settings = await getConnectionSettings();

    return new ScriptBuilder() 
        .addStatements(`KeySetCommParam(${toUrScriptString(settings.ipAddress)}, ${settings.port})`)
        .addStatements('KeyConnect()')
        .ifCondition('not VS_Connected')
        .popup(
            `Could not reach the VS Series at ${settings.ipAddress}:${settings.port}.`,
            'VS Series',
            PopupLevel.ERROR,
            true
        )
        .halt()
        .end();
};

const validate = (node: VsConnectNode, validationContext: ValidationContext): OptionalPromise<ValidationResponse> => ({
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
