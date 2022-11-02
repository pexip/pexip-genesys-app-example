# Pexip Genesys Premium App

![Architecture Diagram](docs/images/01-Architecture-Diagram.png )

This Genesys Premium App uses an Interaction Widget to load the application within the context of a conversation, extracting the Pexip conference information and connecting the Agent directly via WebRTC to the conference in a self-hosted Pexip Infinity installation.

Audio for the conference is still routed through Genesys (via SIP trunk), keeping the audio "in-band" to enable the following:

- Allow agents to slip into and out of video calls as easily as they manage any other interaction within the Genesys Cloud UI.

- Leverage the Genesys in-band recording tools to measure sentiment and engage in automatic flagging of sessions. (The same way that is already done for audio-only calls)

- Use all of the inherent skills-based routing and transfer tools that are already native to Genesys as a huge benefit to video-first experiences such as Telehealth, Virtual Financial Services, Retail Support and many more.

## Setup the Pexip Web App 3 dependencies

In this project, instead of making use of PexRTC, we will reuse the Web App 3 packages. For using that, you should authenticate `npm` to be able to access the repository in `GitLab`.

### Create Access Token

The first step is to create a token that will have read access to the `npm registry`. You can do this from your GitLab preferences panel:

- Open https://gitlab.com
- Once you are logged in, click on your photo in the top-right corner.
- Click on `Preferences`.
- Click on `Access Tokens` on the left panel.
- Create with a least the following permissions:
  - `read_api`
  - `read_registry`

Copy the access token in a save location, since you wont' be able to access to it later. Remove it after completing the following step.

### Configure NPM registry

- Set URL for your scoped packages.

      npm config set @pexip:registry https://gitlab.example.com/api/v4/projects/24337530/packages/npm/

- Add the token for the scoped packages URL. Replace <your_token> with the `access token` that you have created in the previous step.

      npm config set -- '//gitlab.com/api/v4/projects/24337530/packages/npm/:_authToken' "<your_token>"

You should now be able to publish and install npm packages in your project.

Find my information about the login process in the [GitLab documentation](https://docs.gitlab.com/ee/user/packages/npm_registry/#authenticate-to-the-package-registry).

You can find a list of available packages here: https://gitlab.com/pexip/zoo/-/tree/main/src/aquila

The Web App 3 source code, that we can use as an example, is located here: https://gitlab.com/pexip/zoo/-/tree/main/src/aquila/apps/infinity-connect

## Available Scripts

In the project directory, you can run the following commands:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm lint`

Launches the lint runner. It will check the TypeScript files, but also the SCSS files.
Check [eslint](https://eslint.org/) and [stylelint](https://stylelint.io/) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
