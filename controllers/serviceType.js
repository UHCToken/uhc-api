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
    model = require('../model/model');

/**
 * @class
 * @summary Represents a service type service
 * @swagger
 * tags:
 *  - name: "service type"
 *    description: "The service type resource represents to fetch service type information for the provider and patient platform"
 */
class ServiceTypeApiResource {

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
            "permission_group": "serviceType",
            "routes": [
                {
                    "path": "serviceType",
                    "get": {
                        "demand": security.PermissionType.LIST,
                        "method": this.getAll
                    },
                    "post": {
                        "demand": security.PermissionType.READ | security.PermissionType.WRITE,
                        "method": this.post
                    }
                },
                {
                    "path": "serviceType/:uid",
                    "get": {
                        "demand": security.PermissionType.READ,
                        "method": this.get
                    },
                    "put": {
                        "demand": security.PermissionType.READ | security.PermissionType.WRITE,
                        "method": this.put
                    },
                    "delete": {
                        "demand": security.PermissionType.READ | security.PermissionType.WRITE,
                        "method": this.delete
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Gets all service types
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /servicetype:
     *  get:
     *      tags:
     *      - "servicetype"
     *      summary: "Gets all service types"
     *      description: "This method will fetch all service types"
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ServiceTypes"
     *          404:
     *              description: "The specified service type cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:serviceType"
     */
    async getAll(req, res) {
        if (req.principal.grant["serviceType"] & security.PermissionType.WRITE)
            res.status(200).json(await uhx.Repositories.serviceTypeRepository.getAll(true));
        else // not admin
            res.status(200).json(await uhx.Repositories.serviceTypeRepository.getAll(false));
        return true;
    }

    /**
     * @method
     * @summary Creates a new service type
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to send back to the client
     * @swagger
     * /servicetype:
     *  post:
     *      tags:
     *      - "servicetype"
     *      summary: "Registers a new service type in the UHX API"
     *      description: "This method will register a new service type in the UHX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - in: "body"
     *        name: "body"
     *        description: "The service type that is to be created"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ServiceTypes"
     *      responses:
     *          201: 
     *             description: "The requested resource was created successfully"
     *             schema: 
     *                  $ref: "#/definitions/Service Types"
     *          422:
     *              description: "The service type object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:serviceType"
     *      - app_auth:
     *          - "write:serviceType"
     */
    async post(req, res) {

        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

        if (!req.body.name)
            throw new exception.Exception("Must have a name", exception.ErrorCodes.MISSING_PROPERTY);


        res.status(201).json(await uhx.Repositories.serviceTypeRepository.insert(req.body.name, req.body.description));
        return true;
    }

    /**
     * @method
     * @summary Updates an existing service type
     * @param {Express.Request} req The request from the client
     * @param {Express.Response} res The response to the client
     * @swagger
     * /servicetype/{servicetypeid}:
     *  put:
     *      tags:
     *      - "servicetype"
     *      summary: "Updates an existing service type in the UHX API"
     *      description: "This method will update an existing service type in the UHX API"
     *      consumes: 
     *      - "application/json"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "servicetypeid"
     *        in: "path"
     *        description: "The service type ID of the service type being updated"
     *        required: true
     *        type: "string"
     *      - in: "body"
     *        name: "body"
     *        description: "The service type that is to be updated"
     *        required: true
     *        schema:
     *          $ref: "#/definitions/ServiceTypes"
     *      responses:
     *          201: 
     *             description: "The requested resource was updated successfully"
     *             schema: 
     *                  $ref: "#/definitions/ServiceTypes"
     *          404:
     *              description: "The specified service type cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          422:
     *              description: "The servicetype object sent by the client was rejected"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:serviceType"
     *          - "read:serviceType"
     */
    async put(req, res) {
        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

        if (!req.body.type_name)
            throw new exception.Exception("Must have a name", exception.ErrorCodes.MISSING_PROPERTY);

        res.status(200).json(await uhx.Repositories.serviceTypeRepository.update(req.params.uid, req.body.type_name, req.body.description));
        return true;
    }

    /**
     * @method
     * @summary Get a single service type 
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /servicetype/{servicetypeid}:
     *  get:
     *      tags:
     *      - "servicetype"
     *      summary: "Gets an existing service type"
     *      description: "This method will fetch an existing service type"
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "servicetypeid"
     *        in: "path"
     *        description: "The service type ID"
     *        required: true
     *        type: "string"
     *      responses:
     *          200: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ServiceTypes"
     *          404:
     *              description: "The specified service type cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "read:serviceType"
     */
    async get(req, res) {
        res.status(200).json(await uhx.Repositories.serviceTypeRepository.get(req.params.uid));
        return true;
    }

    /**
     * @method
     * @summary Deactivates a service type
     * @param {Express.Reqeust} req The request from the client 
     * @param {Express.Response} res The response from the client
     * @swagger
     * /servicetype/{servicetypeid}:
     *  delete:
     *      tags:
     *      - "servicetype"
     *      summary: "Deactivates a service type in the database"
     *      description: "This method will set the deactivation time of the specified service type so it will no longer appear in searches."
     *      produces:
     *      - "application/json"
     *      parameters:
     *      - name: "servicetypeid"
     *        in: "path"
     *        description: "The service type ID of the service type being deactivated"
     *        required: true
     *        type: "string"
     *      responses:
     *          201: 
     *             description: "The requested resource was fetched successfully"
     *             schema: 
     *                  $ref: "#/definitions/ServiceTypes"
     *          404:
     *              description: "The specified service type cannot be found"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"
     *      security:
     *      - uhx_auth:
     *          - "write:serviceType"
     *          - "read:serviceType"
     */
    async delete(req, res) {
        res.status(201).json(await uhx.Repositories.serviceTypeRepository.delete(req.params.uid));
        return true;
    }
}

// Module exports
module.exports.ServiceTypeApiResource = ServiceTypeApiResource;
