# Storybook Chromatic Link Comment

This action will add a comment to a pull request with a link to the Chromatic storybook for the current branch.

## Inputs

### `app-id`

**Required** The Chromatic app ID.

You can find this in the Chromatic UI by going to Mangage->Collaborate and looking at the permalinks section. You can also see it in your URL when viewing your chromatic project.

You may decide to store this in a secret on your repository.

### `github-token`

**Required** The GitHub token to authenticate with the github api and post the comment.

## Outputs

### `success`

boolean indicating if the comment was posted successfully.

## Example usage

```yaml
uses: actions/hello-world-javascript-action
with:
  app-id: ${{ secrets.CHROMATIC_APP_ID }}
  github-token: ${{ secrets.GITHUB_TOKEN }}
```

testing
