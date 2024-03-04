# Storybook Chromatic Link Comment

This action will add a comment to a pull request with a link to the Chromatic storybook for the current branch.

## Inputs

### `review-url`

URL address to the visual review page.
It is the page `https://www.chromatic.com/review?appId=${appId}&number=${reviewNumber}&type=linked`

The best way is to hydrate it with chromatic's job output: `${{ steps.chromatic.outputs.url }}`

### `build-url`

URL address to the build.
It is the page `https://www.chromatic.com/build?appId=${appId}&number=${buildNr}`

The best way is to hydrate it with chromatic's job output: `${{ steps.chromatic.outputs.buildUrl }}`

### `storybook-url`

URL address to the build.
It is the page `https://${branchName}--${appId}.chromatic.com`

The best way is to hydrate it with chromatic's job output: `${{ steps.chromatic.outputs.storybookUrl }}`

### `app-id`

The Chromatic app ID **Required IF** no URL has been provided

You can find this in the Chromatic UI by going to Mangage->Collaborate and looking at the permalinks section. You can also see it in your URL when viewing your chromatic project.

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
  chromatic-link-comment:
    runs-on: ubuntu-latest
    steps:
      - name: Publish to Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitOnceUploaded: true

      - name: Publish Storybook Link in the comments
        uses: dannyhw/storybook-chromatic-link-comment@v0.4
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          review-url: ${{ steps.chromatic.outputs.url }}
          build-url: ${{ steps.chromatic.outputs.buildUrl }}
          storybook-url: ${{ steps.chromatic.outputs.storybookUrl }}
```

or without call to chromatic action:

```yaml
name: 'comment with storybook link'

on:
  pull_request:
    types: opened

permissions:
  pull-requests: write

jobs:
  chromatic-link-comment:
    runs-on: ubuntu-latest
    steps:
      - name: Storybook Link
        uses: dannyhw/storybook-chromatic-link-comment@v0.4
        with:
          app-id: ${{ secrets.CHROMATIC_APP_ID }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

bla1
