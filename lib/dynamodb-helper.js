'use strict';

const AWS = require('aws-sdk');

class DynamoDBHelper {

    constructor(options) {
        if (process.env.IS_OFFLINE) {
            options = Object.assign(options || {}, {
                region: "localhost",
                endpoint: "http://localhost:8000"
            });
        }

        // Instantiate a document client for AWS DynamoDB
        // For optional arguments, please visit: 
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#constructor-property
        this._docClient = new AWS.DynamoDB.DocumentClient(options);
    }

    create(params) {
        return this._docClient.put(params).promise();
    }

    read(params) {
        return this._docClient.get(params).promise();
    }

    update(params) {
        return this._docClient.update(params).promise();
    }

    delete(params) {
        return this._docClient.delete(params).promise();
    }

}

module.exports = DynamoDBHelper;