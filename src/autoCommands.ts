import { Context } from "probot";

export const autoCommands = [
  {
    ruleName: "added_label",
    webhookName: "issues.labeled",
    ruleMatcher: (context: Context, ruleArgs: string[]): boolean => {
      const labelName = context.payload.label.name;
      return ruleArgs.includes(labelName);
    },
  },
  {
    ruleName: "added_label",
    webhookName: "pull_request.labeled",
    ruleMatcher: (context: Context, ruleArgs: string[]): boolean => {
      const labelName = context.payload.label.name;
      return ruleArgs.includes(labelName);
    },
  },
];
