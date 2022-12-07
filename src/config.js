export default {
  genesys: {
    // OAuth Client ID
    // Created in "Create a Token Implicit OAuth Grant for Genesys Cloud deployment" step
    prodOauthClientID: '2cb43533-5471-4e1d-a2eb-bc8d82aacf34',

    // Token for localhost:3000 redirect in dev environments
    devOauthClientID: 'fa593b6d-c2f1-40a7-8a8f-a26fe7575f16'
  },

  pexip: {
    // Used to identify the conference attendee for proper handling by Pexip Infinity local policy.
    conferencePrefix: 'mp'
  }
}
