'use strict';

const dotenv = require('dotenv');

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

const pending = {};

class KeyVault {
    secrets = null;

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async getSecrets() {
        // Check the Cache
        while (this.secrets === pending) {
            await this.sleep(10);
        }
        if (this.secrets !== null) return this.secrets;
        this.secrets = pending;

        // Fetch the Secrets
        try {
            const secretClient = new SecretClient('https://teaser-rbac.vault.azure.net', new DefaultAzureCredential());
            let secrets = {}
            for await (const secretProperties of secretClient.listPropertiesOfSecrets()) {
                const secret = await secretClient.getSecret(secretProperties.name);
                secrets[secretProperties.name] = secret.value;
            }
            this.secrets = secrets;
        } catch (err) {
            // Fallback to Environment Variables
            console.error(err);
            dotenv.config();
            this.secrets = process.env;
        }

        // Finished!
        return this.secrets;
    }
}

module.exports = new KeyVault();