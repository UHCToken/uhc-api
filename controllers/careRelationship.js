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

const uhx = require('../uhx'),
    exception = require('../exception'),
    security = require('../security'),
    carePlanRepository = require('../repository/carePlanRepository'),
    CarePlan = require('../model/CarePlan'),
    model = require('../model/model');

/**
 * @class
 * @summary Represents a user payment service
 * @swagger
 * tags:
 *  - name: "wallet"
 *    description: "The wallet resource represents a single user's wallet (stellar or other blockchain account, etc.)"
 */
class CareRelationshipApiResource {

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
            "permission_group": "user",
            "routes": [
                {
                    "path": "careRelationship",
                    "post": {
                        "demand": security.PermissionType.READ,
                        "method": this.post
                    },
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "delete": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.delete
                    }
                },
                {
                    "path": "careRelationship/accept",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.accept
                    }
                },
                {
                    "path": "careRelationship/decline",
                    "post": {
                        "demand": security.PermissionType.WRITE,
                        "method": this.decline
                    }
                },
                {
                    "path": "careRelationships",
                    "post": {
                        "demand": security.PermissionType.READ,
                        "method": this.getAll
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
     *  put:
     *      tags:
     *      - "wallet"
     *      summary: "Activates a new blockchain account for the specified user"
     *      description: "This method will activate the user's wallet enabling the balances to appear"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to activate an account for"
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
     *      - uhx_auth:
     *          - "write:wallet"
     */
    async post(req, res) {
        var careRelationship = await uhx.CareLogic.createCareRelationship(req.body, req.principal);
        res.status(201).json(careRelationship);
        return true;
    }

    /**
     * @method
     * @summary Deactivates a wallet
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
    * @swagger
     * /user/{userid}/wallet:
     *  delete:
     *      tags:
     *      - "wallet"
     *      summary: "Deactivates the specified user wallet"
     *      description: "This method will set the deactivation time of the user's wallet"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "path"
     *        name: "userid"
     *        description: "The identity of the user to deactivate a wallet for"
     *        required: true
     *        type: string
     *      responses:
     *          201: 
     *             description: "The deactivation was successful"
     *             schema: 
     *                  $ref: "#/definitions/Wallet"
     *          404: 
     *             description: "The user has not bought any UhX yet and does not have an active wallet"
     *             schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:wallet"
     */
    async delete(req, res) {
        var retVal = [];
        retVal.push(await uhx.Repositories.careRelationshipRepository.delete(req.params.id));
        res.status(201).json(retVal);
        return true;
    }

    /**
     * @summary Gets the specified wallet
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async get(req, res) {

        var serviceInvoice = await uhx.Repositories.careRelationshipRepository.get(req.params.id);
        res.status(200).json(serviceInvoice);
        return true;
    }

        /**
     * @summary Gets the specified wallet
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async accept(req, res) {

        var careRelationship = await uhx.CareLogic.acceptCareRelationship(req.body, req.principal);
        res.status(200).json(careRelationship);
        return true;
    }

    
        /**
     * @summary Gets the specified wallet
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async decline(req, res) {

        var careRelationship = await uhx.CareLogic.declineCareRelationship(req.body, req.principal);
        res.status(200).json(careRelationship);
        return true;
    }


        /**
     * @summary Gets the specified wallet
     * @method
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response to the client
     */
    async getAll(req, res) {
        if(req.body.providerId){
            var careRelationships = await uhx.Repositories.careRelationshipRepository.getByProviderId(req.body.providerId, req.body.status);
        }
        else{
            var careRelationships = await uhx.Repositories.careRelationshipRepository.getByPatientId(req.body.patientId, req.body.status);
        }
        res.status(200).json(careRelationships);
        return true;
    }

}

// Module exports
module.exports.CareRelationshipApiResource = CareRelationshipApiResource;