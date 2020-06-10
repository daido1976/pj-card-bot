export const repositoryOnUser = {
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
