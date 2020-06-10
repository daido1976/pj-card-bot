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
  {
    ruleName: "new_issue",
    webhookName: "issues.opened",
    ruleMatcher: (context: Context, ruleArgs: string[]): boolean => {
      if (ruleArgs.length > 0) {
        // Verify that it matches one of the repositories listed
        const repoNames = ruleArgs;
        return repoNames.indexOf(context.payload.repository.name) >= 0;
      } else {
        return true;
      }
    },
  },
  {
    ruleName: "new_pullrequest",
    webhookName: "pull_request.opened",
    ruleMatcher: (context: Context, ruleArgs: string[]): boolean => {
      if (ruleArgs.length > 0) {
        // Verify that it matches one of the repositories listed
        const repoNames = ruleArgs;
        return repoNames.indexOf(context.payload.repository.name) >= 0;
      } else {
        return true;
      }
    },
  },
];
