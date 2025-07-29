import ReactDOM from 'react-dom/client'
import { App } from './App'

import './index.scss'

// Import styles for the pexip components
import '@pexip/components/src/fonts.css'
import '@pexip/components/dist/components.css'
import '@pexip/media-components/dist/media-components.css'

// Import styles for the toast notifications
// import 'react-toastify/dist/ReactToastify.css'

const root = ReactDOM.createRoot(document.getElementById('root') as Element)
root.render(<App />)
