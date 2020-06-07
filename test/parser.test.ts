import { parseMarkdown } from "../src/parser";

describe("parseMarkdown", () => {
  const note: string =
    "###### Automation Rules\r\n" +
    "\r\n" +
    "<!-- Documentation: https://github.com/philschatz/project-bot -->\r\n" +
    "\r\n" +
    "- `added_label` **wontfix**\r\n" +
    "- `new_pullrequest` **repo1** **repo2**";

  const results: any = note;

  it("parses markdown", () => {
    expect(parseMarkdown(note)).toEqual(results);
  });
});
