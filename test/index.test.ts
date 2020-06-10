import nock from "nock";
import myProbotApp from "../src";
import { Probot } from "probot";
import issueLabeledPayload from "./mocks/issues.labeled.json";
import prOpenedPayload from "./mocks/pull_request.opened.json";
import issueOpenedPayload from "./mocks/issue.opened.json";
import { repositoryOnUser } from "./mocks/graphqlResponse";

describe("PJ Card Bot integration tests", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({ githubToken: "faketoken" });
    probot.load(myProbotApp);
  });

  it("Creates cards when labeled", async () => {
    // query getAllProjectCards
    nock("https://api.github.com")
      .post("/graphql")
      .reply(200, { data: repositoryOnUser });

    // mutation createCard
    nock("https://api.github.com").post("/graphql").reply(200);

    // Receive a webhook event
    await probot.receive({
      name: "issues.labeled",
      payload: issueLabeledPayload,
    });
  });

  it("Creates cards when pr opened", async () => {
    // query getAllProjectCards
    nock("https://api.github.com")
      .post("/graphql")
      .reply(200, { data: repositoryOnUser });

    // mutation createCard
    nock("https://api.github.com").post("/graphql").reply(200);

    // Receive a webhook event
    await probot.receive({
      name: "pull_request.opened",
      payload: prOpenedPayload,
    });
  });

  it("Creates cards when issue opened", async () => {
    // query getAllProjectCards
    nock("https://api.github.com")
      .post("/graphql")
      .reply(200, { data: repositoryOnUser });

    // mutation createCard
    nock("https://api.github.com").post("/graphql").reply(200);

    // Receive a webhook event
    await probot.receive({
      name: "pull_request.opened",
      payload: issueOpenedPayload,
    });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
