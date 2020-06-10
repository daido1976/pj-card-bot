import nock from "nock";
import myProbotApp from "../src";
import { Probot } from "probot";
import payload from "./mocks/issues.labeled.json";
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
    await probot.receive({ name: "issues.labeled", payload });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
