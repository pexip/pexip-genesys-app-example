// Copyright 2024 Pexip AS
//
// SPDX-License-Identifier: Apache-2.0

import {
  createCanvasTransform,
  createMediapipeSegmenter,
  createVideoTrackProcessor,
  createVideoTrackProcessorWithFallback,
  createVideoProcessor,
  ProcessVideoTrack,
  PROCESSING_HEIGHT,
  PROCESSING_WIDTH,
  RenderEffects
} from '@pexip/media-processor'

const selfieModel = 'general' // 'landscape' or 'general'
const SETTINGS_PROCESSING_WIDTH = 256
const SETTINGS_PROCESSING_HEIGHT = 144

// Create symbolic link to link bg-blur/selfie_segmentation to a public folder
// Thus we can create a URL object to get the link to be used for the `gluePath`
const selfieJs = new URL(
  './selfie_segmentation/selfie_segmentation.js',
  document.baseURI
)

const bgImageUrl = new URL(
  './media-processor/background.jpg',
  document.baseURI
)

const processors: any = []

const getTrackProcessor = (): ProcessVideoTrack => {
  // Feature detection if the browser has the `MediaStreamProcessor` API
  if ('MediaStreamTrackProcessor' in window) {
    return createVideoTrackProcessor() // Using the latest Streams API
  }
  return createVideoTrackProcessorWithFallback() // Using the fallback implementation
}

const getProcessedStream = async (stream: MediaStream, effect?: RenderEffects, preview: boolean = false, save: boolean = false): Promise<MediaStream> => {
  effect = effect ?? localStorage.getItem('pexipEffect') as RenderEffects
  effect = effect ?? 'none'

  if (save) setCurrentEffect(effect)

  if (effect === 'none') {
    return stream
  }

  const processor = processors.find((node: any) => node.preview === preview)
  if (processor != null) {
    stopProcessedStream(processor.streamId)
  }

  const segmenter = createMediapipeSegmenter('selfie_segmentation', {
    modelType: selfieModel,
    // processingWidth: preview ? SETTINGS_PROCESSING_WIDTH : PROCESSING_WIDTH,
    // processingHeight: preview ? SETTINGS_PROCESSING_HEIGHT : PROCESSING_HEIGHT,
    processingWidth: SETTINGS_PROCESSING_WIDTH,
    processingHeight: SETTINGS_PROCESSING_HEIGHT,
    gluePath: selfieJs.href
  })

  const transformer = createCanvasTransform(segmenter, {
    effects: effect,
    width: PROCESSING_WIDTH,
    height: PROCESSING_HEIGHT,
    bgImageUrl: bgImageUrl.href
  })

  const videoProcessor = createVideoProcessor([transformer], getTrackProcessor())

  await videoProcessor.open()

  // Passing the raw MediaStream to apply the effects
  // Then, use the output stream for whatever purpose
  const processedStream = await videoProcessor.process(stream)

  processors.push({
    preview,
    streamId: processedStream?.id,
    originalStream: stream,
    segmenter,
    transformer,
    videoProcessor
  })

  return processedStream
}

const stopProcessedStream = (streamId: string): void => {
  const index = processors.findIndex((node: any) => node.streamId === streamId)
  if (processors[index] != null) {
    processors[index].originalStream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
    processors[index].videoProcessor.close()
    processors[index].videoProcessor.destroy()
    processors[index].transformer.close()
    processors[index].transformer.destroy()
    processors[index].segmenter.close()
    processors[index].segmenter.destroy()
  }
  processors.splice(index, 1)
}

const getCurrentEffect = (): RenderEffects => {
  return localStorage.getItem('pexipEffect') as RenderEffects ?? 'none'
}

const setCurrentEffect = (effect: RenderEffects): void => {
  localStorage.setItem('pexipEffect', effect)
}

export {
  getProcessedStream,
  stopProcessedStream,
  getCurrentEffect,
  setCurrentEffect
}
