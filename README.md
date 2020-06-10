# <img src='assets/pj-card-bot-192x192.png' width='32' alt='pj-icon'> PJ Card Bot

🤖 A GitHub App built with [Probot](https://github.com/probot/probot) that automatically adding cards of Issue/Pull Request on a Project board.

This is an alternative to [philschatz/project-bot](https://github.com/philschatz/project-bot).

## Installation

Go to the [GitHub App page](https://github.com/apps/pj-card-bot) and click `Install` (or `Configure` if you already installed it).

## What's the difference with project-bot?

Unlike the project-bot, the PJ Card Bot has the following specifications.

- The automation card must be at the bottom of a column.
- Only three rules can be set, `new_issue`, `new_pullrequest`, and `added_label`.
- When `added_label`, a new card is added to the project. (This is my motivation for creating this bot.)

## Example

To create an Automation Card, create a Card in a Project like this:

```md
###### Automation Rules

<!-- Documentation: https://github.com/philschatz/project-bot -->

- `assigned_issue`
- `closed_issue`
- `added_label` **wontfix**
- `new_pullrequest` **repo1** **repo2**
```

Now, whenever any Issue that is assigned, or closed, or a `wontfix` label is added, or a new Pull Request is opened on the `repo1` or `repo2` repository will show up in this Column.

## Development

See. https://probot.github.io/docs/development/#running-the-app-locally

```sh
# build & watch
$ npm run dev
```
