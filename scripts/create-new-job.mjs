/**
 * This script handles all the boilerplate code needed to create a new job.
 * It does the following:
 * - Asks and then validates the job name;
 * - Creates the job structure, with the src folder and index.ts file in the jobs folder;
 * - Creates the package.json with default dependencies;
 * - Creates the tsconfig.json;
 * - Creates the Dockerfile;
 * - Adds the new job to the root package.json scripts, ex: "start:my-new-job": "turbo start --filter my-new-job"
 * - Adds the new job to the CI/CD, meaning adding it to the .github/workflows/ci.yml file, in the matrix action that publishes the jobs;
 * - Installs dependencies with pnpm;
 */

'use strict'

import * as fs from 'fs'
import { execSync } from 'child_process'
import _readline from 'readline'

const readline = _readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const log = console.log

const DEV_DEPENDENCIES = {
  '@types/lodash': '4.14.196',
  '@types/node': '20.4.9',
  '@typescript-eslint/eslint-plugin': '6.3.0',
  '@typescript-eslint/parser': '6.3.0',
  eslint: '8.46.0',
  prettier: '^3.0.1',
  'ts-node': '^10.9.1',
  typescript: '5.1.6',
  vitest: '0.34.1',
}

const DEPENDENCIES = {
  '@aws-sdk/client-s3': '^3.387.0',
  dotenv: '^16.3.1',
  lodash: '^4.17.21',
  mongodb: '^5.7.0',
  zod: '^3.21.4',
  '@interop-be-reports/commons': 'workspace:*',
}

const REGEX_JOB_NAME = /^[a-z0-9-]+$/
const MAX_JOB_NAME_LENGTH = 50
const MIN_JOB_NAME_LENGTH = 5
const JOB_BASE_PATH = './jobs'

const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
}

function createNewJob(jobName) {
  log(`\n> Creating new job named ${chalk.blue(jobName)}...`)

  try {
    log('> Creating job structure...')
    setupJobStructure(jobName)
    log(`> Creating ${chalk.blue('package.json')} with default deps...`)
    createPackageJson(jobName)
    log(`> Creating ${chalk.blue('tsconfig.json')}...`)
    createTsConfig(jobName)
    log(`> Creating ${chalk.blue('Dockerfile')}...`)
    createDockerfile(jobName)
    log(`> Adding new job to root package.json scripts...`)
    addToRootPackageJsonScripts(jobName)
    log(`> Adding new job to ci/cd...`)
    addToGitHubCIActions(jobName)
    log('> Installing dependencies...')
    execSync(`pnpm i`)
  } catch (err) {
    cleanUpOnError(jobName)
    throw err
  }

  log(chalk.green(`\n> Job ${jobName} created successfully!`))
}

function validateJobName(jobName) {
  if (!jobName) {
    log(chalk.red('Job name is required, please provide it as an argument.'))
    log(chalk.blue("Example: 'node create-new-job my-new-job'\n"))
    process.exit(1)
  }

  if (fs.existsSync(`./${JOB_BASE_PATH}/${jobName}`)) {
    log(chalk.red(`Job ${jobName} already exists.\n`))
    process.exit(1)
  }

  if (jobName.length > MAX_JOB_NAME_LENGTH) {
    log(chalk.red(`Job name must be less than ${MAX_JOB_NAME_LENGTH} characters.\n`))
    process.exit(1)
  }

  if (jobName.length < MIN_JOB_NAME_LENGTH) {
    log(chalk.red(`Job name must be at least ${MIN_JOB_NAME_LENGTH} characters.\n`))
    process.exit(1)
  }

  if (!REGEX_JOB_NAME.test(jobName)) {
    log(chalk.red('Job name must be lowercase, alphanumeric and can contain dashes.\n'))
    process.exit(1)
  }
}

function setupJobStructure(jobName) {
  fs.mkdirSync(`${JOB_BASE_PATH}/${jobName}/src`, { recursive: true })
  fs.writeFileSync(`${JOB_BASE_PATH}/${jobName}/src/index.ts`, `console.log("Hello World")`)
}

function createPackageJson(jobName) {
  const packageJson = {
    name: jobName,
    main: './dist/index.js',
    type: 'module',
    scripts: {
      test: 'echo "Error: no test specified"',
      lint: 'eslint . --ext .ts,.tsx',
      'lint:autofix': 'eslint . --ext .ts,.tsx --fix',
      'format:check': 'prettier --check src',
      'format:write': 'prettier --write src',
      start: 'node --watch --loader ts-node/esm ./src/index.ts',
      build: 'tsc',
    },
    devDependencies: DEV_DEPENDENCIES,
    dependencies: DEPENDENCIES,
  }

  fs.writeFileSync(`${JOB_BASE_PATH}/${jobName}/package.json`, JSON.stringify(packageJson, null, 2))
}

function createTsConfig(jobName) {
  fs.writeFileSync(
    `${JOB_BASE_PATH}/${jobName}/tsconfig.json`,
    JSON.stringify(
      {
        extends: '../../tsconfig.json',
        compilerOptions: {
          outDir: 'dist',
        },
        include: ['src'],
      },
      null,
      2
    )
  )
}

function createDockerfile(jobName) {
  fs.writeFileSync(
    `${JOB_BASE_PATH}/${jobName}/Dockerfile`,
    `
FROM node:18-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

# Set working directory
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo prune --scope=${jobName} --docker

# remove all empty node_modules folder structure
RUN rm -rf /app/out/full/*/*/node_modules

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN corepack enable

# Build the project
COPY --from=builder /app/out/full/ .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=${jobName}

CMD node ./jobs/${jobName}/dist
`
  )
}

function addToGitHubCIActions(jobName) {
  const githubCIActions = fs.readFileSync('./.github/workflows/ci.yml', 'utf8')
  const fileArray = githubCIActions.split('\n')
  const index = fileArray.findIndex((line) => line.includes('include:'))
  for (let i = index + 1; i < fileArray.length; i++) {
    if (!fileArray[i].includes('image_name:') && !fileArray[i].includes('package_path:')) {
      fileArray.splice(
        i,
        0,
        `          - image_name: ${jobName}
            package_path: ./jobs/${jobName}`
      )
      break
    }
  }
  fs.writeFileSync('./.github/workflows/ci.yml', fileArray.join('\n'))
}

function addToRootPackageJsonScripts(jobName) {
  const packageJson = fs.readFileSync('./package.json', 'utf8')
  const fileArray = packageJson.split('\n')
  const startLineIndex = fileArray.findIndex((line) => line.includes('"start:'))

  for (let i = startLineIndex + 1; i < fileArray.length; i++) {
    if (!fileArray[i].includes('start:')) {
      fileArray.splice(i, 0, `    "start:${jobName}": "turbo start --filter ${jobName}",`)
      break
    }
  }

  const buildLineIndex = fileArray.findIndex((line) => line.includes('"build:'))

  for (let i = buildLineIndex + 1; i < fileArray.length; i++) {
    if (!fileArray[i].includes('build:')) {
      fileArray.splice(i, 0, `    "build:${jobName}": "turbo build --filter ${jobName}",`)
      break
    }
  }

  fs.writeFileSync('./package.json', fileArray.join('\n'))
}

function cleanUpOnError(jobName) {
  execSync(`rm -rf ${JOB_BASE_PATH}/${jobName}`)
}

readline.question('Insert job name\n> ', (name) => {
  readline.close()
  validateJobName(name)
  createNewJob(name)
})
