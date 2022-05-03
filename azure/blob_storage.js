'use strict';

const { BlobServiceClient } = require("@azure/storage-blob");

class BlobStorage {
    async getFile(connectionString, container, blobName) {
        const blobServiceClient = new BlobServiceClient(connectionString);
        const containerClient = blobServiceClient.getContainerClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        return blockBlobClient.downloadToBuffer();
    }

    async getFiles(connectionString, container) {
        const blobServiceClient = new BlobServiceClient(connectionString);
        const containerClient = blobServiceClient.getContainerClient(container);
        const blobs = [];
        for await (const blob of containerClient.listBlobsFlat()) {
            blobs.push(blob.name);
        }
        return blobs;
    }

    saveFile(connectionString, container, blobName, blobBody) {
        const blobServiceClient = new BlobServiceClient(connectionString);
        const containerClient = blobServiceClient.getContainerClient(container);
        return containerClient.uploadBlockBlob(blobName, blobBody, blobBody.length, {});
    }
}

module.exports = BlobStorage;