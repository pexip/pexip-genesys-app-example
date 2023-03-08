import configDev from './config-dev.js'
import configProd from './config-prod.js'

let config
if (location.origin + location.pathname === configDev.wizardUriBase) {
  config = Object.assign(configProd, configDev)
} else {
  config = configProd
}
export default config
