import { Application } from "probot"; // eslint-disable-line no-unused-vars

const addComment = `
  mutation comment($id: ID!, $body: String!) {
    addComment(input: {subjectId: $id, body: $body}) {
      clientMutationId
    }
  }
`;

export = (app: Application) => {
  app.on("issues.labeled", async (context) => {
    console.log("labeled!!!", context);
    context.github.graphql(addComment, {
      id: context.payload.issue.node_id,
      body: "Hello world!",
    });
  });
};
