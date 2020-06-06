import { Application } from "probot"; // eslint-disable-line no-unused-vars

const addComment = `
  mutation comment($id: ID!, $body: String!) {
    addComment(input: {subjectId: $id, body: $body}) {
      clientMutationId
    }
  }
`;

const projectCards = `
query getCardAndColumnAutomationCards($issueUrl: URI!) {
  resource(url: $issueUrl) {
    ... on Issue {
      projectCards(first: 100) {
        nodes {
          id
          url
          column {
            name
            id
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
    context.github.graphql(addComment, {
      id: context.payload.issue.node_id,
      body: "Hello world!",
    });

    const { resource }: any = await context.github.graphql(projectCards, {
      issueUrl: issueUrl,
    });

    logger.info("resource!!!", resource);
    const cardsForIssue = resource.projectCards.nodes;
    for (const issueCard of cardsForIssue) {
      logger.info("issueCard!!!", issueCard);
    }
  });
};
