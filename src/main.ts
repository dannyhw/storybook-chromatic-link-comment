import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
import fetch from 'node-fetch'

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token')
    const appId: string = core.getInput('app-id')
    const reviewUrl: string = core.getInput('review-url')
    const buildUrlInput: string = core.getInput('build-url')
    const storybookUrlInput: string = core.getInput('storybook-url')

    if (!token) {
      throw new Error('github-token is required')
    }

    if ((!buildUrlInput || !storybookUrlInput) && !appId) {
      throw new Error(
        'app-id is required, when build-url and storybook-url are not provided'
      )
    }

    const {
      repo: {repo, owner},
      issue: {number},

      ref
    } = github.context

    let branch: string | undefined
    if (github.context.eventName === 'pull_request') {
      branch = process.env.GITHUB_HEAD_REF
    } else {
      // Other events where we have to extract branch from the ref
      // Ref example: refs/heads/master, refs/tags/X
      const branchParts = ref.split('/')
      branch = branchParts.slice(2).join('/')
    }

    const branchName = branch?.replace('refs/heads/', '').replace('/', '-')

    if (!branchName) throw new Error('Could not find branch name')

    // fallback to using the app-id based url
    const buildUrl =
      buildUrlInput ?? `https://www.chromatic.com/build?appId=${appId}`
    const branchStorybookUrl = `https://${branchName}--${appId}.chromatic.com`
    const storybookUrl = storybookUrlInput ?? branchStorybookUrl
    core.info(`creating octokit client`)
    const octokit = new Octokit({auth: `token ${token}`, request: {fetch}})

    core.debug(`Using appid: ${appId}`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const commentFindBy = `<!-- Created by storybook-chromatic-link-comment -->`

    const comment = `${commentFindBy}
## 🔍 Visual review for your branch is published 🔍

Here are the links to:

${
  reviewUrl
    ? `
- the [Visual Review Page](${reviewUrl})
`
    : ``
}
- the [latest build on chromatic](${buildUrl})
- the [full storybook](${storybookUrl})
- the [branch specific storybook](${branchStorybookUrl})
`
    core.info(`Fetching comments for issue: ${github.context.issue.number}`)
    const {data: comments} = await octokit.issues.listComments({
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

      await octokit.issues.createComment({
        issue_number: number,
        owner,
        repo,
        body: comment
      })
    } else if (existingComment && comments.length < 100) {
      core.info(`attempting to update existing comment: ${existingComment.id}`)
      await octokit.issues.updateComment({
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
