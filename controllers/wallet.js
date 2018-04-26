'use strict';

/**
 * Copyright 2018 Universal Health Coin
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
 * IN THE SOFTWARE.
 * 
 * Developed on behalf of Universal Health Coin by the Mohawk mHealth & eHealth Development & Innovation Centre (MEDIC)
 */
 
const uhc = require('../uhc'),
    exception = require('../exception'),
    security = require('../security');

/**
 * @class
 * @summary Represents a user payment service
 * @swagger
 * tags:
 *  - name: "wallet"
 *    description: "The wallet resource represents a single user's wallet (stellar or other blockchain account, etc.)"
 */
class WalletApiResource {

    /**
     * @constructor
     */
    constructor() {

    }
    /**
     * @method
     * @summary Get routing information for this class
     */
    get routes() {
        return {
            "permission_group": "wallet",
            "routes" : [
                {
                    "path" : "user/:uid/wallet",
                    "post": {
                        "demand" : security.PermissionType.WRITE,
                        "method" : this.post
                    },
                    "get" : {
                        "demand":security.PermissionType.LIST,
                        "method": this.get
                    }
                }
            ]
        };
    }
    /**
     * @method
     * @summary Posts a new transaction to the wallet
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
    * @swagger
     * /user/{userid}/wallet:
     *  post:
     *      tags:
     *      - "wallet"
     *      summary: "Creates a new blockchain account for the specified user"
     *      description: "This method will construct a new account object and associate it with the specified user account"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to create a wallet for"
     *        required: true
     *        type: string
     *      - in: "body"
     *        name: "body"
     *        description: "The wallet to be created (note: Address is generated automatically, only balances is used to establish an initial balance if this service permits)"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/Wallet"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Wallet"
     *          422:
     *              description: "The user object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "write:wallet"
     */
    async post(req, res)  {
        throw new exception.NotImplementedException();
    }
    /**
     * @method
     * @summary Get a single transaction posted to a user's wallet
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
    * @swagger
     * /user/{userid}/wallet:
     *  get:
     *      tags:
     *      - "wallet"
     *      summary: "Gets summary information about the user's wallet"
     *      description: "This method will return summary information for the user's wallet including balances, public address, etc."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to create a wallet for"
     *        required: true
     *        type: string
     *      responses:
     *          200: 
     *             description: "The user's wallet information"
     *             schema: 
     *                  $ref: "#/definitions/Wallet"
     *          404: 
     *             description: "The user has not bought any UHC yet and does not have an active wallet"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhc_auth:
     *          - "read:wallet"
     */
    async get(req, res) {
        throw new exception.NotImplementedException();
    }

}

// Module exports
module.exports.WalletApiResource = WalletApiResource;