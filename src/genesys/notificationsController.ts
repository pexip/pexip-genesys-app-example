/**
 * This file manages the channel that listens to chat events.
 */
import platformClient from 'purecloud-platform-client-v2'

const notificationsApi = new platformClient.NotificationsApi()

let channel: any = {}
let ws = null

// Object that will contain the subscription topic as key and the
// callback function as the value
const subscriptionMap: any = {
  'channel.metadata': () => {
    console.log('Notification heartbeat.')
  }
}

/**
 * Creation of the channel. If called multiple times,
 * the last one will be the active one.
 */
export const createChannel = () => {
  return notificationsApi.postNotificationsChannels().then((data) => {
    console.log('---- Created Notifications Channel ----')
    console.log(data)

    channel = data
    ws = new WebSocket(channel.connectUri)
    ws.onmessage = onSocketMessage
  })
}

/**
 * Add a subscription to the channel
 * @param {String} topic PureCloud notification topic string
 * @param {Function} callback callback function to fire when the event occurs
 */
export const addSubscription = (topic: string, callback: Function) => {
  const body = [{ id: topic }]

  return notificationsApi
    .postNotificationsChannelSubscriptions(channel.id, body)
    .then((data) => {
      subscriptionMap[topic] = callback
      console.log(`Added subscription to ${topic}`)
    })
}

/**
 * Callback function for notications event-handling.
 * It will reference the subscriptionMap to determine what function to run
 * @param {Object} event
 */
const onSocketMessage = (event: any) => {
  const data = JSON.parse(event.data)

  subscriptionMap[data.topicName](data)
}
