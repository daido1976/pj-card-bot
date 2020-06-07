import marked from "marked";

export const parseMarkdownToRules = (
  note: string
): { ruleName: string; ruleArgs: string[] }[] => {
  const rules: { ruleName: string; ruleArgs: string[] }[] = [];
  // FIXME: Update src/@types/marked/index.d.ts & Do not use any type
  const tokens: any = marked.lexer(note);
  const listToken = tokens.find((token: any) => token.type === "list");

  listToken.items.forEach((listItem: any) => {
    const rule: { ruleName: string; ruleArgs: string[] } = {
      ruleName: "",
      ruleArgs: [],
    };
    // 何故か type 'text' が途中に挟まってるので、チェーンして呼び出ししてる
    // @example textTokens
    // [
    //   { type: "codespan", raw: "`added_label`", text: "added_label" },
    //   { type: "text", raw: " ", text: " " },
    //   { type: "strong", raw: "**wontfix**", text: "wontfix", },
    // ];
    const textTokens = listItem.tokens[0].tokens;
    textTokens.forEach((token: any) => {
      if (token.type === "codespan") {
        rule.ruleName = token.text;
      } else if (token.type === "strong") {
        rule.ruleArgs.push(token.text);
      }
    });
    rules.push(rule);
  });

  return rules;
};
