import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token')
    const appId: string = core.getInput('app-id')

    if (!token) {
      throw new Error('github-token is required')
    }

    if (!appId) {
      throw new Error('app-id is required')
    }

    const {
      repo: {repo, owner},
      sha,
      ref
    } = github.context

    let {number} = github.context.issue

    const octokit = github.getOctokit(token)

    if (!number) {
      try {
        // Based on https://github.com/orgs/community/discussions/27071#discussioncomment-4943026
        const result =
          await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
            commit_sha: sha,
            owner,
            repo
          })

        number = result.data[0].number
      } catch (e) {
        if (e instanceof Error) core.error(e)
        throw new Error(
          'No issue number found preventing any comment from being added or updated. This will happen if your action is ran on push and an associated PR is not found.'
        )
      }
    }

    let branch: string | undefined
    if (github.context.eventName === 'pull_request') {
      branch = process.env.GITHUB_HEAD_REF
    } else {
      // Other events where we have to extract branch from the ref
      // Ref example: refs/heads/master, refs/tags/X
      const branchParts = ref.split('/')
      branch = branchParts.slice(2).join('/')
    }

    const branchName = branch
      ?.replace('refs/heads/', '')
      .replace('/', '-')
      .substr(0, 37)

    if (!branchName) throw new Error('Could not find branch name')

    // Do not use ?? as the default input is an empty string
    // fallback to using the app-id based url
    const branchStorybookUrl = `https://${branchName}--${appId}.chromatic.com`

    core.debug(`Using appid: ${appId}`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const commentFindBy = `<!-- Created by storybook-link-comment -->`

    const comment = `${commentFindBy}
## Storybook Preview

Click [here](${branchStorybookUrl}) to access the Storybook preview for this branch.
`

    core.debug(`owner: ${owner}, repo: ${repo}, issue_number: ${number}`)
    const {data: comments} = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: number,
      per_page: 100
    })

    const existingComment = comments.find(({body}) =>
      body?.includes(commentFindBy)
    )

    if (!existingComment && comments.length < 100) {
      core.info(`Leaving comment: ${comment}`)

      await octokit.rest.issues.createComment({
        issue_number: number,
        owner,
        repo,
        body: comment
      })
    } else if (existingComment) {
      core.info(`attempting to update existing comment: ${existingComment.id}`)
      await octokit.rest.issues.updateComment({
        comment_id: existingComment.id,
        owner,
        repo,
        body: comment
      })
    } else {
      core.info(
        `Found existing comment or number of comments is over 100
         hasExistingComment: ${!!existingComment},
         length: ${comments.length}`
      )
    }

    core.setOutput('success', true)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
