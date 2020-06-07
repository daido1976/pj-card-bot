import { parseMarkdown } from "../src/parser";

describe("parseMarkdown", () => {
  const note: string =
    "###### Automation Rules\r\n" +
    "\r\n" +
    "<!-- Documentation: https://github.com/philschatz/project-bot -->\r\n" +
    "\r\n" +
    "- `added_label` **wontfix**\r\n" +
    "- `new_pullrequest` **repo1** **repo2**\r\n" +
    "- `new_issue`";

  const results: { ruleName: string; ruleArgs: string[] }[] = [
    {
      ruleName: "added_label",
      ruleArgs: ["wontfix"],
    },
    {
      ruleName: "new_pullrequest",
      ruleArgs: ["repo1", "repo2"],
    },
    {
      ruleName: "new_issue",
      ruleArgs: [],
    },
  ];

  it("parses markdown to rules", () => {
    expect(parseMarkdown(note)).toEqual(results);
  });
});
