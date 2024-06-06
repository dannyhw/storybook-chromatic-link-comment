# Storybook Link Comment

This action will add a comment to a pull request with a link to the Storybook
URL from Chromatic for the current branch.

## Inputs

### `app-id`

The Chromatic app ID is required.

You can find this in the Chromatic UI by going to Mangage -> Collaborate and
looking at the permalinks section. You can also see it in your URL when viewing
your chromatic project.

You may decide to store this in a secret on your repository.

### `github-token`

**Required** The GitHub token to authenticate with the github api and post the comment.

## Outputs

### `success`

boolean indicating if the comment was posted successfully.

## Example usage

```yaml
name: 'comment with storybook link'

on:
  pull_request:
    types: opened

permissions:
  pull-requests: write

jobs:
  chromatic-deployment:
    runs-on: ubuntu-latest
    steps:
      - name: Publish to Chromatic
        id: chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitOnceUploaded: true

      - name: PR comment with Storybook link
        uses: danielmoraes/storybook-link-comment@v0.12
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          storybook-url: ${{ steps.chromatic.outputs.storybookUrl }}
```
