import https from 'https'
import fs from 'fs'

const selfieSegmenterUrl = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite'
const workerInputPath = 'node_modules/@pexip/media-processor/dist/workers/mediaWorker.js'
const workerOutputPath = 'public/workers/mediaWorker.js'
const wasmInputPath = 'node_modules/@mediapipe/tasks-vision/wasm'
const wasmOutputPath = 'public/wasm'

const downloadSelfieSegmenter = () => {
  console.log('Downloading selfie_segmenter.tflite')
  https.get(selfieSegmenterUrl, (response) => {
    const file = fs.createWriteStream('public/models/selfie_segmenter.tflite')
    response.pipe(file)
    file.on('finish', () => {
      file.close(() => {
        console.log('Selfie segmenter downloaded')
      })
    })
  })
}

const copyWorkerInPublicFolder = () => {
  console.log('Coping worker in public folder')
  fs.copyFileSync(workerInputPath, workerOutputPath)
}

const copyWasmInPublicFolder = () => {
  console.log('Coping wasm in public folder')
  fs.cpSync(wasmInputPath, wasmOutputPath, { recursive: true })
}

copyWorkerInPublicFolder()
copyWasmInPublicFolder()
downloadSelfieSegmenter()
