import {
  createCanvasTransform,
  createMediapipeSegmenter,
  createVideoTrackProcessor,
  createVideoTrackProcessorWithFallback,
  createVideoProcessor,
  ProcessVideoTrack,
  RenderEffects
} from '@pexip/media-processor'

const selfieModel = 'general' // 'landscape' or 'general'

const PROCESSING_WIDTH = 768
const PROCESSING_HEIGHT = 432

const getProcessedStream = async (stream: MediaStream, effect?: RenderEffects, save: boolean = false): Promise<MediaStream> => {
  effect = effect ?? localStorage.getItem('pexipEffect') as RenderEffects
  effect = effect ?? 'none'

  if (save) setCurrentEffect(effect)

  if (effect === 'none') {
    return stream
  }

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

  const segmenter = createMediapipeSegmenter('selfie_segmentation', {
    modelType: selfieModel,
    processingWidth: PROCESSING_WIDTH,
    processingHeight: PROCESSING_HEIGHT,
    gluePath: selfieJs.href
  })

  const transformer = createCanvasTransform(segmenter, {
    effects: effect,
    width: PROCESSING_WIDTH,
    height: PROCESSING_HEIGHT,
    bgImageUrl: bgImageUrl.href
  })

  const getTrackProcessor = (): ProcessVideoTrack => {
    // Feature detection if the browser has the `MediaStreamProcessor` API
    if ('MediaStreamTrackProcessor' in window) {
      return createVideoTrackProcessor() // Using the latest Streams API
    }
    return createVideoTrackProcessorWithFallback() // Using the fallback implementation
  }

  const videoProcessor = createVideoProcessor([transformer], getTrackProcessor())

  await videoProcessor.open()

  // Passing the raw MediaStream to apply the effects
  // Then, use the output stream for whatever purpose
  const processedStream = await videoProcessor.process(stream)

  return processedStream
}

const getCurrentEffect = (): RenderEffects => {
  return localStorage.getItem('pexipEffect') as RenderEffects ?? 'none'
}

const setCurrentEffect = (effect: RenderEffects): void => {
  localStorage.setItem('pexipEffect', effect)
}

export {
  getProcessedStream,
  getCurrentEffect,
  setCurrentEffect
}
