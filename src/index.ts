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

// const getCardAndColumnAutomationCards = `
//   query getCardAndColumnAutomationCards($issueUrl: URI!) {
//     resource(url: $issueUrl) {
//       ... on Issue {
//         projectCards(first: 10) {
//           nodes {
//             id
//             url
//             column {
//               name
//               id
//             }
//             project {
//               ${PROJECT_FRAGMENT}
//             }
//           }
//         }
//       }
//     }
//   }
// `;

const getAllProjectCards = `
  query getAllProjectCards($issueUrl: URI!) {
    resource(url: $issueUrl) {
      ... on Issue {
        id
        repository {
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
          ${"" /* ... or on a Repository */}
          projects(first: 10, states: [OPEN]) {
            nodes {
              ${PROJECT_FRAGMENT}
            }
          }
        }
      }
    }
  }
`;

export = (app: Application) => {
  const logger = app.log.child({ name: "projectabot" });
  app.on("issues.labeled", async (context) => {
    logger.info("labeled!!!", context);
    const issueUrl = context.payload.issue.html_url;
    const issueId = context.payload.issue.node_id;
    const { resource }: any = await context.github.graphql(getAllProjectCards, {
      issueUrl: issueUrl,
    });

    logger.info("resource!!!", resource);
    const projects = resource.repository.projects.nodes;
    const columns: any = [];
    projects.forEach((pj: any) => {
      logger.info("project!!!", pj);
      pj.columns.nodes.forEach((col: any) => {
        logger.info("column!!!", col);
        columns.push(col);
      });
    });
    logger.info("multiple columns!!!", columns);

    // すでに追加済みの時は Project already has the associated issue のエラーが出る
    await context.github.graphql(
      `
      mutation createCard($contentId: ID!, $columnId: ID!) {
        addProjectCard(input: {contentId: $contentId, projectColumnId: $columnId}) {
          clientMutationId
        }
      }
    `,
      { contentId: issueId, columnId: columns[0].id }
    );
  });
};
