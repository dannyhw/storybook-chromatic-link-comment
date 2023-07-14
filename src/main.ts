import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
import fetch from 'node-fetch'

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token')
    const appId: string = core.getInput('app-id')

    if (!token) throw new Error('github-token is required')
    if (!appId) throw new Error('appId is required')

    const octokit = new Octokit({auth: `token ${token}`, request: {fetch}})

    const {
      repo: {repo, owner},
      issue: {number},
      payload
    } = github.context

    core.debug(`Using appid: ${appId}`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const commentFindBy = `<!-- Created by storybook-chromatic-link-comment -->`

    const branchName = payload.pull_request?.head.ref
      .replace('refs/heads/', '')
      .replace('/', '-')

    if (!branchName) throw new Error('Could not find branch name')

    const comment = `${commentFindBy}\nHeres the [storybook](https://${branchName}--${appId}.chromatic.com) for your branch`

    const {data: comments} = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: number,
      per_page: 100
    })

    const existingComment = comments.find(
      ({body}) => body?.includes(commentFindBy)
    )

    if (!existingComment && comments.length < 100) {
      core.info(`Leaving comment: ${comment}`)

      octokit.issues.createComment({
        issue_number: number,
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
