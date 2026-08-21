import {
  registerSidebarBehavior,
  SidebarItemBehaviors,
} from "@universal-robots/contribution-api";

const behaviors: SidebarItemBehaviors = {
  factory: () => {
    return {
      type: "keyence-vs-series-vs-sidebar",
      version: "1.0.0",
    };
  },
};

registerSidebarBehavior(behaviors);
