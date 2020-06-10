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

// TODO: gql ファイルに移す
// `fs.readFileSync("./hoge.gql").toString();` で読み込む
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
  query getAllProjectCards($repositoryId: ID!) {
    node(id: $repositoryId) {
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
  logger.info(`Starting up`);

  autoCommands.forEach(({ webhookName, ruleName, ruleMatcher }) => {
    logger.trace(`Attaching listener for ${webhookName}`);

    app.on(webhookName, async (context) => {
      logger.trace(`Event received for ${webhookName}`);

      const repositoryId = context.payload.repository.node_id;
      const issueOrPrId =
        context.payload.issue?.node_id || context.payload.pull_request.node_id;

      const { node: repository }: any = await context.github.graphql(
        getAllProjectCards,
        {
          repositoryId,
        }
      );

      logger.info("repository!!!", repository);

      // Organization の時は Owner に紐づく projects、User の時は Repository に紐づく projects を取得する
      //   User の時に Owner に紐づく projects を取得することもできるが、
      //   https://github.com/daido1976?tab=projects のようなユーザに紐づく意図しない projects になってしまう
      // NOTE: getAllProjectCards の query で ... on Organization で owner の projects を取得しているため、
      //   User の時は repository.owner.projects が nullish になるためこう書ける
      const projects =
        repository.owner.projects?.nodes || repository.projects.nodes;

      // 当該 Webhook イベントに対応する全ての自動化ルール
      // （`issues.labeled` イベントなら projects 内にある Automation Rules の note に書かれた全ての `added_label` ルール）
      //   後ほど context.payload の値が ruleArgs（ラベルやリポジトリ名の配列）に含まれているかを
      //   ruleMatcher でチェックし、含まれていれば GitHub API を叩いてカード作成を行う
      //   ※ ruleName でのフィルタと ruleArgs でのフィルタの二段階になっている
      const autoRules: {
        column: any;
        ruleName: string;
        ruleArgs: string[];
      }[] = [];

      // User の時も対象の Repository が複数の projects を持つ場合がある
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

          // Webhook イベントに対応する rule がある場合に、その rule のみを autoRules に追加する
          if (rule) {
            autoRules.push({
              column,
              ...rule,
            });
          }
        });
      });

      logger.info("autoRules!!!", autoRules);

      // FIXME: forEach でかけるはず
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
