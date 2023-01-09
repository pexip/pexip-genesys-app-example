const mediaProcessorMock = {
  createCanvasTransform: jest.fn(),
  createMediapipeSegmenter: jest.fn(),
  createVideoTrackProcessor: jest.fn(),
  createVideoTrackProcessorWithFallback: jest.fn(),
  createVideoProcessor: () => ({
    open: jest.fn(),
    process: jest.fn()
  }),
  ProcessVideoTrack: jest.fn(),
  RenderEffect: jest.fn()
}

module.exports = mediaProcessorMock
export {}
