# Pexip Genesys Premium App

![Architecture Diagram](docs/images/01-Architecture-Diagram.png)

This Genesys Premium App uses an Interaction Widget to load the application
within the context of a conversation, extracting the Pexip conference
information and connecting the Agent directly via WebRTC to the conference in a
self-hosted Pexip Infinity installation.

Audio for the conference is still routed through Genesys (via SIP trunk),
keeping the audio "in-band" to enable the following:

- Allow agents to slip into and out of video calls as easily as they manage any
  other interaction within the Genesys Cloud UI.

- Leverage the Genesys in-band recording tools to measure sentiment and engage
  in automatic flagging of sessions. (The same way that is already done for
  audio-only calls)

- Use all of the inherent skills-based routing and transfer tools that are
  already native to Genesys as a huge benefit to video-first experiences such as
  Telehealth, Virtual Financial Services, Retail Support and many more.

## Available Scripts

In the project directory, you can run the following commands:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests)
for more information.

### `npm lint`

Launches the lint runner. It will check the TypeScript files, but also the SCSS
files. Check [eslint](https://eslint.org/) and
[stylelint](https://stylelint.io/) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best
performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about
[deployment](https://facebook.github.io/create-react-app/docs/deployment) for
more information.

## Validate the setup process

We have a setup process (aka wizard) that is located in the folder
`public/setup`. This is a bundle of HTML, CSS and JS files provided by Genesys
with some customizations.

This setup is launched one the customer launch the integration for the first
time and it creates the necessary group and interaction widget.

Genesys also provides a validator that is located in `setup-validator`. For
launching the validator the first step is to go to the validator folder:

      $ cd setup-validator

Then we will install all its dependencies:

      $ npm install

The final step is to launch the validator that will print a report:

      $ npm start
