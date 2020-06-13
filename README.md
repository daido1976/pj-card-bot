# <img src='assets/pj-card-bot-192x192.png' width='32' alt='pj-icon'> PJ Card Bot

🤖 A GitHub App built with [Probot](https://github.com/probot/probot) that automatically adding cards of Issue/Pull Request on a Project board.

This bot is inspired by [philschatz/project-bot](https://github.com/philschatz/project-bot).

## Installation

Go to the [GitHub App page](https://github.com/apps/pj-card-bot) and click `Install` (or `Configure` if you already installed it).

## What's the difference with project-bot?

Unlike the project-bot, the PJ Card Bot has the following specifications.

- The automation rule card must be at the bottom of a column and set `PJ Card Bot Rules` in the heading.
- Only three rules can be set, `new_issue`, `new_pullrequest`, and `added_label`.
- When `added_label`, a new card is added to the project. (This is my motivation for creating this bot.)

## Example

The way to set the Automation Card is almost the same as the project-bot.

```md
###### PJ Card Bot Rules

<!-- Documentation: https://github.com/daido1976/pj-card-bot -->

- `added_label` **dependencies** **security**
- `new_pullrequest` **repo-name1** **repo-name2**
- `new_issue`
```

Now, when the `dependencies` or `security` label is added, new card is adding to column where the note is placed.
And, when the new Pull Request is opened in `repo-name1` or `repo-name2`, new card is adding to column in the same way.
Finaly, when the new Issue is opend in any repositories, new card is adding to column.

## Development

See. https://probot.github.io/docs/development/#running-the-app-locally

```sh
# build & watch
$ npm run dev
```
