# Publishing to npm

This document explains how to set up automated publishing to npm using GitHub Actions.

## Setting up the NPM_TOKEN

To enable automatic publishing to npm when a new GitHub release is created, you need to set up an NPM authentication token as a GitHub secret.

### Step 1: Generate an npm Access Token

1. Log in to your npm account at [npmjs.com](https://www.npmjs.com/)
2. Click on your profile picture in the top right corner and select "Access Tokens"
3. Click "Generate New Token"
4. Select "Publish" as the token type
5. Give your token a description (e.g., "GitHub Actions publishing")
6. Click "Generate Token"
7. Copy the generated token (you won't be able to see it again)

### Step 2: Add the Token to GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click "New repository secret"
5. Name: `NPM_TOKEN`
6. Value: Paste the npm token you generated
7. Click "Add secret"

## Creating a Release

Once you have set up the NPM_TOKEN, you can publish a new version by creating a GitHub release:

1. Go to your GitHub repository
2. Click on "Releases" in the right sidebar
3. Click "Create a new release"
4. Choose a tag version (e.g., `v1.0.1`) - this will be used as the npm package version
5. Add a title and description for your release
6. Click "Publish release"

The GitHub Actions workflow will automatically:
1. Build and test the package
2. Update the version in package.json to match the release tag
3. Publish the package to npm

## Troubleshooting

If the automatic publishing fails, check the following:

1. Ensure the NPM_TOKEN is correctly set up in GitHub Secrets
2. Verify that the token has publish permissions
3. Check that the package name in package.json is available on npm
4. Look at the GitHub Actions logs for specific error messages
