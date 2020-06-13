import { parseMarkdownToRules } from "../src/parser";

describe("parseMarkdownToRules", () => {
  describe("when note is valid", () => {
    const note: string =
      "###### PJ Card Bot Rules\r\n" +
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
      expect(parseMarkdownToRules(note)).toEqual(results);
    });
  });

  describe("when note has invalid heading", () => {
    const note: string =
      "###### Automation Rules\r\n" +
      "\r\n" +
      "<!-- Documentation: https://github.com/philschatz/project-bot -->\r\n" +
      "\r\n" +
      "- `added_label` **wontfix**\r\n" +
      "- `new_pullrequest` **repo1** **repo2**\r\n" +
      "- `new_issue`";

    const results: { ruleName: string; ruleArgs: string[] }[] = [];

    it("returns empty array", () => {
      expect(parseMarkdownToRules(note)).toEqual(results);
    });
  });

  describe("when note has invalid list", () => {
    const note: string =
      "###### PJ Card Bot Rules\r\n" +
      "- `added_label` **wontfix**\r\n" +
      "- new_pullrequest repo1 **repo2**\r\n" +
      "- `new_issue`";

    const results: { ruleName: string; ruleArgs: string[] }[] = [
      {
        ruleName: "added_label",
        ruleArgs: ["wontfix"],
      },
      {
        ruleName: "new_issue",
        ruleArgs: [],
      },
    ];

    // Not implemented yet
    xit("parses markdown to rules only valid listitem", () => {
      expect(parseMarkdownToRules(note)).toEqual(results);
    });
  });
});
