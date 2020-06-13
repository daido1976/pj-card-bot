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
        const repoName = context.payload.repository.name;
        return ruleArgs.includes(repoName);
      } else {
        // If no args, apply the rule in any repositories
        return true;
      }
    },
  },
  {
    ruleName: "new_pullrequest",
    webhookName: "pull_request.opened",
    ruleMatcher: (context: Context, ruleArgs: string[]): boolean => {
      if (ruleArgs.length > 0) {
        const repoName = context.payload.repository.name;
        return ruleArgs.includes(repoName);
      } else {
        // If no args, apply the rule in any repositories
        return true;
      }
    },
  },
];
