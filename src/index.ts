import { Application } from "probot"; // eslint-disable-line no-unused-vars

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
  const logger = app.log.child({ name: "projectabot" });
  app.on(["issues.labeled", "pull_request.labeled"], async (context) => {
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
    const columns: any = [];
    // User の時も対象の repository が複数の projects を持つ場合あり
    projects.forEach((project: any) => {
      logger.info("project!!!", project);
      project.columns.nodes.forEach((column: any) => {
        logger.info("column!!!", column);
        const lastCard = column.lastCards.nodes[0];
        logger.info("lastCard!!!", lastCard);
        columns.push({
          column,
          // TODO: lastCard を parse して ruleName (eg. 'added_label', 'new_issue' ) と ruleArgs (eg. ['dependencies', 'bug']) を抜き出す
          ruleName: "",
          ruleArgs: [],
        });
      });
    });
    logger.info("multiple columns!!!", columns);

    // TODO: すでに追加済みの時は Project already has the associated issue のエラーが出るのでハンドリングする
    await context.github.graphql(
      `
      mutation createCard($contentId: ID!, $columnId: ID!) {
        addProjectCard(input: {contentId: $contentId, projectColumnId: $columnId}) {
          clientMutationId
        }
      }
    `,
      { contentId: issueOrPrId, columnId: columns[0].id }
    );
  });
};
