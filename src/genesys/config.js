export default {
  // 'development' or 'production'
  // environment: 'production',
  environment: 'development',

  // Using local test servers
  developmentUri: 'https://localhost:3000',

  // Publicly accessible location where the admin-app files are hosted.
  // This is different than the Pexip conference node value below.
  prodUri: 'https://pexip.github.io/pexip-genesys-agent-blueprint/agent-app/',

  // Id for the video DOM element. Only change this if you customize index.html.
  videoElementId: 'pexip-video-container',
  selfviewElementId: 'pexip-selfview',
  presentationElementId: 'pexip-presentation-container',

  genesys: {
    // OAuth Client ID
    // Created in "Create a Token Implicit OAuth Grant for Genesys Cloud deployment" step
    prodOauthClientID: 'bde46253-e5e1-43b4-bc8f-35711b3c41d1',

    // Token for localhost:3000 redirect in dev enviroments
    devOauthClientID: 'fa593b6d-c2f1-40a7-8a8f-a26fe7575f16'
  },

  pexip: {
    // Used to identify the conference attendee for proper handling by Pexip Infinity local policy.
    conferencePrefix: 'mp'
  }
}
