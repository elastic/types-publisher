"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adal_node_1 = require("adal-node");
const azure_keyvault_1 = require("azure-keyvault");
const util_1 = require("../util/util");
const settings_1 = require("./settings");
var Secret;
(function (Secret) {
    /**
     * Used to upload blobs.
     * To find (or refresh) this value, go to https://ms.portal.azure.com -> All resources -> typespublisher -> General -> Access keys
     */
    Secret[Secret["AZURE_STORAGE_ACCESS_KEY"] = 0] = "AZURE_STORAGE_ACCESS_KEY";
    /**
     * Lets the server update an issue (https://github.com/Microsoft/types-publisher/issues/40) on GitHub in case of an error.
     * Create a token at: https://github.com/settings/tokens
     */
    Secret[Secret["GITHUB_ACCESS_TOKEN"] = 1] = "GITHUB_ACCESS_TOKEN";
    /**
     * This is used to ensure that only GitHub can send messages to our server.
     * This should match the secret value set on GitHub: https://github.com/DefinitelyTyped/DefinitelyTyped/settings/hooks
     * The Payload URL should be the URL of the Azure service.
     * The webhook ignores the `sourceRepository` setting and can be triggered by *anything* with the secret,
     * so make sure only DefinitelyTyped has the secret.
     */
    Secret[Secret["GITHUB_SECRET"] = 2] = "GITHUB_SECRET";
    /**
     * Token used to perform request to NPM's API.
     * This was generated by doing:
     * - `npm login`
     * - copy the token value (comes after `authToken=`) in `~/.npmrc`
     * - `rm ~/.npmrc` (don't want to accidentally log out this token.)
     *
     * We only need one token in existence, so delete old tokens at: https://www.npmjs.com/settings/tokens
     */
    Secret[Secret["NPM_TOKEN"] = 3] = "NPM_TOKEN";
})(Secret = exports.Secret || (exports.Secret = {}));
exports.allSecrets = util_1.mapDefined(Object.keys(Secret), key => {
    const value = Secret[key];
    return typeof value === "number" ? value : undefined; // tslint:disable-line strict-type-predicates (tslint bug)
});
/**
 * Convert `AZURE_STORAGE_ACCESS_KEY` to `azure-storage-access-key`.
 * For some reason Azure wouldn't allow secret names with underscores.
 */
function azureSecretName(secret) {
    return Secret[secret].toLowerCase().replace(/_/g, "-");
}
function getSecret(secret) {
    const client = getClient();
    return new Promise((resolve, reject) => {
        client.getSecret(settings_1.azureKeyvault, azureSecretName(secret), process.env.TYPES_PUBLISHER_CLIENT_SECRET_VERSION, (error, bundle) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(bundle.value);
            }
        });
    });
}
exports.getSecret = getSecret;
function getClient() {
    const clientId = process.env.TYPES_PUBLISHER_CLIENT_ID;
    const clientSecret = process.env.TYPES_PUBLISHER_CLIENT_SECRET;
    const clientSecretVersion = process.env.TYPES_PUBLISHER_CLIENT_SECRET_VERSION;
    if (!(clientId && clientSecret && clientSecretVersion)) {
        throw new Error("Must set the TYPES_PUBLISHER_CLIENT_ID, TYPES_PUBLISHER_CLIENT_SECRET and TYPES_PUBLISHER_CLIENT_SECRET_VERSION environment variables.");
    }
    // Copied from example usage at https://www.npmjs.com/package/azure-keyvault
    const credentials = new azure_keyvault_1.KeyVaultCredentials((challenge, callback) => {
        const context = new adal_node_1.AuthenticationContext(challenge.authorization);
        context.acquireTokenWithClientCredentials(challenge.resource, clientId, clientSecret, (error, tokenResponse) => {
            if (error) {
                throw error;
            }
            callback(undefined, `${tokenResponse.tokenType} ${tokenResponse.accessToken}`);
        });
    });
    return new azure_keyvault_1.KeyVaultClient(credentials);
}
//# sourceMappingURL=secrets.js.map