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
    security = require('../security'),
    exception = require('../exception'),
    Group = require('../model/Group'),
    User = require('../model/User');

/**
 * @class
 * @summary Represents a resource to fetch Groups
 * @swagger
 * tags:
 *    - name: group
 *      description: A resource to fetch user group information from the UHX API
 */
module.exports.GroupApiResource = class GroupApiResource {

    /**
     * @property
     * @summary Returns the routes to the API controller
     */
    get routes() {
        return {
            permission_group: "group",
            routes: [
                {
                    "path": "group",
                    "get": {
                        demand: security.PermissionType.LIST,
                        method: this.getAll
                    },
                    "post": {
                        demand: security.PermissionType.WRITE,
                        method: this.create
                    }
                },
                {
                    "path": "group/:gid",
                    "get": {
                        demand: security.PermissionType.READ,
                        method: this.get
                    },
                    "delete": {
                        demand: security.PermissionType.WRITE,
                        method: this.delete
                    }
                },
                {
                    "path": "group/:gid/user",
                    "get": {
                        demand: security.PermissionType.LIST | security.PermissionType.READ,
                        method: this.listUsers
                    }
                },
                {
                    "path": "group/:gid/user/:uid",
                    "post": {
                        demand: security.PermissionType.WRITE,
                        method: this.addUser
                    },
                    "delete": {
                        demand: security.PermissionType.WRITE,
                        method: this.deleteUser
                    }
                }
            ]
        };
    }

    /**
     * @method
     * @summary Get all groups from the server
     * @param {Express.Request} req The HTTP request from the client
     * @param {Express.Response} res The HTTP response from the server
     * @swagger
     * /group:
     *  get:
     *      tags:
     *      - "group"
     *      summary: "Gets all groups from the server"
     *      description: "This method return all active groups available for use in the API server"
     *      produces:
     *      - "application/json"
     *      responses:
     *          200: 
     *             description: "The requested resource was retrieved successfully"
     *             schema: 
     *                  $ref: "#/definitions/Group"
     *          404:
     *              description: "The specified asset does not exist"
     *              schema: 
     *                  $ref: "#/definitions/Exception"
     *          500:
     *              description: "An internal server error occurred"
     *              schema:
     *                  $ref: "#/definitions/Exception"     
     *      security:
     *      - uhx_auth:
     *          - "list:group"
     */
    async getAll(req, res) {
        res.status(200).json(await uhx.Repositories.groupRepository.getAll());
        return true;
    }

    /**
     * @method
     * @summary Creates a new group in the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async create(req, res) {

        if (!req.body)
            throw new exception.Exception("Missing body", exception.ErrorCodes.MISSING_PAYLOAD);

        var group = new Group().copy(req.body);
        res.status(201).json(await uhx.Repositories.groupRepository.insert(group, req.Principal));
        return true;
    }

    /**
     * @method
     * @summary Get a specific group in the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async get(req, res) {
        if (!req.params.gid)
            throw new exception.Exception("Missing group id parameter", exception.ErrorCodes.MISSING_PROPERTY);

        res.status(200).json(await uhx.Repositories.groupRepository.get(req.params.gid));
        return true;
    }

    /**
     * @method
     * @summary Deactivates the specified group from the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async delete(req, res) {
        if (!req.params.gid)
            throw new exception.Exception("Missing group id parameter", exception.ErrorCodes.MISSING_PROPERTY);

        res.status(201).json(await uhx.Repositories.groupRepository.delete(req.params.gid));
        return true;
    }

    /**
     * @method
     * @summary Lists users the specified group from the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async listUsers(req, res) {

        if (!req.params.gid)
            throw new exception.Exception("Missing group id parameter", exception.ErrorCodes.MISSING_PROPERTY);

        res.status(200).json(await uhx.Repositories.groupRepository.getUsers(req.params.gid));
        return true;
    }

    /**
     * @method
     * @summary Adds a user to the specified group in the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async addUser(req, res) {

        if (!req.params.gid)
            throw new exception.Exception("Missing group id parameter", exception.ErrorCodes.MISSING_PROPERTY);
        if (!req.params.uid)
            throw new exception.Exception("Missing user id parameter", exception.ErrorCodes.MISSING_PROPERTY);

        if (req.params.gid == uhx.Config.security.sysgroups.providers) {
            var providerExists = await uhx.Repositories.providerRepository.checkIfExists(req.params.uid);
            if (providerExists)
                await uhx.Repositories.providerRepository.reactivate(req.params.uid);
        }

        if (req.params.gid == uhx.Config.security.sysgroups.patients) {
            var patientExists = await uhx.Repositories.patientRepository.checkIfExists(req.params.uid);
            if (patientExists)
                await uhx.Repositories.patientRepository.reactivate(req.params.uid);
        }

        res.status(200).json(await uhx.Repositories.groupRepository.addUser(req.params.gid, req.params.uid));
        return true;
    }

    /**
     * @method
     * @summary Removes a user from the specified group in the UHX API
     * @param {Express.Request} req The HTTP request fromthis client
     * @param {Express.Response} res The HTTP response going to the client
     */
    async deleteUser(req, res) {
        if (!req.params.gid)
            throw new exception.Exception("Missing group id parameter", exception.ErrorCodes.MISSING_PROPERTY);
        if (!req.params.uid)
            throw new exception.Exception("Missing user id parameter", exception.ErrorCodes.MISSING_PROPERTY);

        if (req.params.gid == uhx.Config.security.sysgroups.providers) {
            var providerExists = await uhx.Repositories.providerRepository.checkIfExists(req.params.uid);
            if (providerExists)
                await uhx.Repositories.providerRepository.delete(req.params.uid);
        }

        if (req.params.gid == uhx.Config.security.sysgroups.patients) {
            var patientExists = await uhx.Repositories.patientRepository.checkIfExists(req.params.uid);
            if (patientExists)
                await uhx.Repositories.patientRepository.delete(req.params.uid);
        }
        res.status(201).json(await uhx.Repositories.groupRepository.removeUser(req.params.gid, req.params.uid));
        return true;
    }
}

