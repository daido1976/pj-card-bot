import nock from "nock";
import myProbotApp from "../src";
import { Probot } from "probot";
import payload from "./mocks/issues.labeled.json";

const repositoryOnUser = {
  node: {
    owner: {},
    projects: {
      nodes: [
        {
          columns: {
            nodes: [
              {
                id: "hoge",
                lastCards: {
                  nodes: [
                    {
                      url: "url",
                      id: "fuga",
                      note:
                        "###### Automation Rules\r\n" +
                        "\r\n" +
                        "<!-- Documentation: https://github.com/philschatz/project-bot -->\r\n" +
                        "\r\n" +
                        "- `added_label` **wontfix**\r\n" +
                        "- `new_pullrequest` **repo1** **repo2**\r\n" +
                        "- `new_issue`",
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  },
};

describe("My Probot app", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({ githubToken: "faketoken" });
    probot.load(myProbotApp);
  });

  it("test1", async () => {
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
