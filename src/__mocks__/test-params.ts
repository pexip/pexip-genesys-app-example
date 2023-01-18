/**
 * In this file we define some variables that will help to change the behavior
 * of the application. This way, we will be able to provoke some errors and
 * check that it's working as expected.
 */
Object.defineProperty(window, 'testParams', {
  value: {
    // Simulate that we don't have any camera connected to the computer
    enumerateDevicesEmpty: false,
    // Simulate that the media permission was rejected
    rejectGetUserMedia: false,
    // Simulate that the Infinity conference node isn't available
    infinityUnavailable: false
  }
})

export {}
