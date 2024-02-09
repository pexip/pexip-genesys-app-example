// Copyright 2024 Pexip AS
//
// SPDX-License-Identifier: Apache-2.0

const mediaProcessorMock = {
  createCanvasTransform: () => ({
    close: jest.fn(),
    destroy: jest.fn()
  }),
  createMediapipeSegmenter: () => ({
    close: jest.fn(),
    destroy: jest.fn()
  }),
  createVideoTrackProcessor: jest.fn(),
  createVideoTrackProcessorWithFallback: jest.fn(),
  createVideoProcessor: () => ({
    close: jest.fn(),
    destroy: jest.fn(),
    open: jest.fn(),
    process: jest.fn()
  }),
  ProcessVideoTrack: jest.fn(),
  RenderEffect: jest.fn()
}

module.exports = mediaProcessorMock
export {}
