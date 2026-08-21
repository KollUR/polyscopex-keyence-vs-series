/// <reference lib="webworker" />
import {
    ApplicationBehaviors,
    ApplicationNode,
    OptionalPromise,
    registerApplicationBehavior,
    ScriptBuilder
} from '@universal-robots/contribution-api';
import { VsApplicationNode } from './vs-application.node';
import { buildVsPreamble } from '../../urscript/vs-preamble';

export const VS_DEFAULT_IP_ADDRESS = '192.168.0.10';
export const VS_DEFAULT_PORT = 8500;

const createApplicationNode = (): OptionalPromise<VsApplicationNode> => ({
    type: 'keyence-vs-series-vs-application',
    version: '1.0.0',
    ipAddress: VS_DEFAULT_IP_ADDRESS,
    port: VS_DEFAULT_PORT
});

// Runs before any program-node script, so Connect, Command and Update Position
// only ever emit calls. addRaw keeps the function bodies at their own indent.
const generatePreambleScriptCode = (node: VsApplicationNode): OptionalPromise<ScriptBuilder> =>
    new ScriptBuilder().addRaw(buildVsPreamble(node.ipAddress, node.port));

// A node saved before ipAddress and port existed still has to open, so fall
// back to the default for any field the loaded node is missing.
const upgradeApplicationNode = (loadedNode: ApplicationNode, defaultNode: VsApplicationNode): VsApplicationNode => ({
    ...defaultNode,
    ...loadedNode,
    version: defaultNode.version
});

const downgradeApplicationNode = (loadedNode: ApplicationNode, defaultNode: VsApplicationNode): VsApplicationNode =>
    defaultNode;

const behaviors: ApplicationBehaviors = {
    factory: createApplicationNode,
    generatePreamble: generatePreambleScriptCode,
    upgradeNode: upgradeApplicationNode,
    downgradeNode: downgradeApplicationNode
};

registerApplicationBehavior(behaviors);
