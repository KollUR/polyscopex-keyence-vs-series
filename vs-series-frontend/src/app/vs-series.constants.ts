/** Identifiers that must agree with manifest.yaml and contribution.json. */
export const VS_APPLICATION_NODE_TYPE = 'keyence-vs-series-vs-application';
export const VS_BACKEND_CONTAINER_ID = 'vs-series-backend';
export const VS_BACKEND_INGRESS_ID = 'rest-api';

/** Interval for the teach-time reachability poll, which runs only while a view is visible. */
export const VS_REACHABILITY_POLL_MS = 5000;

/** Name of the runtime socket the preamble opens. Teach-time checks never use it. */
export const VS_SOCKET_NAME = 'CAM';

/** KeyConnect gives up after this many socket_open attempts instead of looping forever. */
export const VS_CONNECT_RETRY_COUNT = 10;
export const VS_CONNECT_RETRY_DELAY_S = 0.2;

/** Tool number the Update Position node registers the capture position against. */
export const VS_DEFAULT_TOOL_NO = 0;

/** VS_socket_wait_react gives up after this long, so a silent VS Series cannot hang a program. */
export const VS_SOCKET_READ_TIMEOUT_S = 3;
export const VS_SOCKET_READ_POLL_S = 0.05;

/** Replies kept in VS_ReplyLog for diagnostics. Newest first; not program logic. */
export const VS_REPLY_LOG_SIZE = 5;
