import config from '../config/config.js';
import { GC_OBJECT_BASE_URL_MAP, GC_CATEGORY_URL_MAP, GC_CATEGORY_LABEL } from './enums.js';

/**
 * Build the complete URL for the resource. Used in the summary page
 * @param {String} environment GC environment. eg mypurecloud.com
 * @param {String} category provisioningKey of the module
 * @param {String} id id of the actual GC object
 * @returns {String|null} path to the resource.
 */
export function getResourcePath(environment, category, id) {
    let objectBasePath = GC_OBJECT_BASE_URL_MAP[category];
    if (!objectBasePath) {
        let categoryPath = GC_CATEGORY_URL_MAP[category];
        if (!categoryPath) return null;
        return `https://apps.${environment}${categoryPath}`;
    } else {
        return `https://apps.${environment}${objectBasePath}${id}`;
    }
}

/**
 * Returns a display version of the GC object module. eg. data-table -> Data Tables
 * Used for summary page
 * @param {String} key the exported provisioningKey of the module
 */
export function beautifyModuleKey(key) {
    let categoryLabel = GC_CATEGORY_LABEL[key];
    if (!categoryLabel) {
        const words = key.split('-');
        const capitalizedWords = words.map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        return capitalizedWords.join(' ') + 's';
    } else {
        return categoryLabel;
    }
}

/**
 * Get the query parameters and return an object 
 * @returns {Object} {language(?): ..., environment(?): ..., uninstall(?): ...}
 */
export function getQueryParameters() {
    let ret = {};
    let urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error')) {
        // Manage Error (Authorization Code Grant with PKCE returns it in the query string)
        let errorCode = urlParams.get('error');
        let errorDescription = urlParams.get('error_description');
        let stateParam = urlParams.get('state');
        if (stateParam) {
            ret = JSON.parse(decodeURIComponent(stateParam));
        }

        ret.error = true;
        if (errorCode) ret.errorCode = errorCode;
        if (errorDescription) ret.errorDescription = errorDescription;
    } else if (urlParams.get('code')) {
        // Return from the Genesys login page with an authorization code
        let stateParam = urlParams.get('state');
        if (stateParam) {
            ret = JSON.parse(decodeURIComponent(stateParam));
        } else {
            ret.errorCode = "400";
            ret.errorDescription = "Missing state";
            ret.error = true;
        }
    } else if (window.location.search) {
        // Get Query Parameters
        let language = urlParams.get(config.languageQueryParam);
        let environment = urlParams.get(config.genesysCloudEnvironmentQueryParam);
        let uninstall = urlParams.get('uninstall');

        if (language) ret.language = language;
        if (environment) ret.environment = environment;
        if (uninstall) ret.uninstall = uninstall;
    }

    return ret;
}
