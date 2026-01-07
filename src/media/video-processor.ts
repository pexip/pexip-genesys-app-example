import {
  type ProcessVideoTrack,
  type VideoProcessor,
  createCanvasTransform,
  createSegmenter,
  createVideoProcessor,
  createVideoTrackProcessor,
  createVideoTrackProcessorWithFallback
} from '@pexip/media-processor'
import { type Effect } from '../types/Effect'

const basePath = import.meta.env.BASE_URL

export const getVideoProcessor = async (
  effect: Effect
): Promise<VideoProcessor> => {
  // Setting the path to that `@mediapipe/tasks-vision` assets
  // It will be passed direct to
  // [FilesetResolver.forVisionTasks()](https://ai.google.dev/edge/api/mediapipe/js/tasks-vision.filesetresolver#filesetresolverforvisiontasks)
  const tasksVisionBasePath = `${basePath}/wasm`

  const segmenter = createSegmenter(tasksVisionBasePath, {
    modelAsset: {
      path: `${basePath}/models/selfie_segmenter.tflite`,
      modelName: 'selfie'
    }
  })

  const transformer = createCanvasTransform(segmenter, {
    effects: effect,
    backgroundImageUrl: `${basePath}/media-processor/background.jpg`
  })

  const getTrackProcessor = (): ProcessVideoTrack => {
    // Feature detection if the browser has the `MediaStreamProcessor` API
    if ('MediaStreamTrackProcessor' in window) {
      return createVideoTrackProcessor() // Using the latest Streams API
    }
    return createVideoTrackProcessorWithFallback() // Using the fallback implementation
  }

  const processor = createVideoProcessor([transformer], getTrackProcessor())

  // Start the processor
  await processor.open()

  return processor
}
