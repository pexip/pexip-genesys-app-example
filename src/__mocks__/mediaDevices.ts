Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    enumerateDevices: async () => {
      return await new Promise<any[]>(resolve => {
        resolve([])
      })
    },
    getUserMedia: async () => {
      return await new Promise<MediaStream>(resolve => {
        resolve(new MediaStream())
      })
    }
  }
})

window.MediaStream = jest.fn().mockImplementation(() => ({
  addTrack: jest.fn()
  // Add any method you want to mock
}))

export {}
