import { Application, Context } from "probot";
import { parseMarkdownToRules } from "./parser";

const autoCommands = [
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

const PROJECT_FRAGMENT = `
  name
  id
  columns(first: 50) {
    totalCount
    nodes {
      id
      url
      lastCards: cards(last: 1, archivedStates: NOT_ARCHIVED) {
        totalCount
        nodes {
          url
          id
          note
        }
      }
    }
  }
`;

// FIXME: getAllProjectColumns かもしれない
const getAllProjectCards = `
  query getAllProjectCards($id: ID!) {
    node(id: $id) {
      ... on Repository  {
        owner {
          url
          ${"" /* Projects can be attached to an Organization... */}
          ... on Organization {
            projects(first: 10, states: [OPEN]) {
              nodes {
                ${PROJECT_FRAGMENT}
              }
            }
          }
        }
        ${"" /* ... or on a Repository for User */}
        projects(first: 10, states: [OPEN]) {
          nodes {
            ${PROJECT_FRAGMENT}
          }
        }
      }
    }
  }
`;

export = (app: Application) => {
  const logger = app.log.child({ name: "pj-card-bot" });
  autoCommands.forEach(({ webhookName, ruleName, ruleMatcher }) => {
    app.on(webhookName, async (context) => {
      logger.info("labeled!!!", context);
      const issueOrPrId =
        context.payload.issue?.node_id || context.payload.pull_request.node_id;
      const repoId = context.payload.repository.node_id;

      const { node }: any = await context.github.graphql(getAllProjectCards, {
        id: repoId,
      });

      logger.info("node!!!", node);
      // Organization の時は node.owner.projects.nodes にする
      // NOTE: getAllProjectCards の query で ... on Organization で owner の projects を取得しているため、
      //   User の時は node.owner.projects がない
      const projects = node.owner.projects?.nodes || node.projects.nodes;
      const autoRules: {
        column: any;
        ruleName: string;
        ruleArgs: string[];
      }[] = [];
      // User の時も対象の repository が複数の projects を持つ場合あり
      projects.forEach((project: any) => {
        logger.info("project!!!", project);
        project.columns.nodes.forEach((column: any) => {
          logger.info("column!!!", column);
          const lastCard = column.lastCards.nodes[0];
          logger.info("lastCard!!!", lastCard);

          // note に Markdown 形式で書かれた rules をパースする
          const rules = lastCard?.note
            ? parseMarkdownToRules(lastCard.note)
            : [];

          // Webhook イベントに対応する rule を見つける
          const rule = rules.find(({ ruleName: rn }) => rn === ruleName);

          if (rule) {
            autoRules.push({
              column,
              ...rule,
            });
          }
        });
      });
      logger.info("autoRules!!!", autoRules);

      for (const { column, ruleArgs } of autoRules) {
        if (ruleMatcher(context, ruleArgs)) {
          // TODO: すでに追加済みの時は Project already has the associated issue のエラーが出るのでハンドリングする
          await context.github.graphql(
            `
            mutation createCard($contentId: ID!, $columnId: ID!) {
              addProjectCard(input: {contentId: $contentId, projectColumnId: $columnId}) {
                clientMutationId
              }
            }
          `,
            { contentId: issueOrPrId, columnId: column.id }
          );
        }
      }
    });
  });
};
