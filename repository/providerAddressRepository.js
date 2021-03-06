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

const pg = require('pg'),
    exception = require('../exception'),
    ProviderAddress = require('../model/ProviderAddress'),
    security = require('../security'),
    model = require('../model/model');

/**
 * @class ProviderRepository
 * @summary Represents the provider repository logic
 */
module.exports = class ProviderAddressRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.getUserIdByAddress = this.getUserIdByAddress.bind(this);
        this.getAllForProvider = this.getAllForProvider.bind(this);
        this.checkIfLatLonExists = this.checkIfLatLonExists.bind(this);
        this.query = this.query.bind(this);
        this.update = this.update.bind(this);
        this.insert = this.insert.bind(this);
        this.getAddressServiceTypes = this.getAddressServiceTypes.bind(this);
        this.insertServiceType = this.insertServiceType.bind(this);
        this.deleteServiceType = this.deleteServiceType.bind(this);
        this.delete = this.delete.bind(this);
    }

    /**
     * @method
     * @summary Retrieve a specific provider address from the database
     * @param {uuid} id Gets the specified provider address
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderAddress} The retrieved provider address
     */
    async get(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM provider_addresses WHERE deactivation_time IS NULL AND id = $1", [id]);
            if (rdr.rows.length == 0)
                return null;
            else
                return new ProviderAddress().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Retrieves the user id of a provider address
     * @param {uuid} id The id of the provider address
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {string} The retrieved user id
     */
    async getUserIdByAddress(id, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query(`
                SELECT users.id
                FROM users
                JOIN providers ON users.id = providers.user_id
                JOIN provider_addresses ON providers.id = provider_addresses.provider_id
                WHERE provider_addresses.id = $1`, [id]);
            if (rdr.rows.length == 0)
                return null;
            else
                return rdr.rows[0].id;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve all of a provider's addresses from the database
     * @param {uuid} providerId Gets all of the specified provider's address
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The retrieved provider addresses
     */
    async getAllForProvider(providerId, _txc) {

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM provider_addresses WHERE deactivation_time IS NULL AND provider_id = $1 ORDER BY GREATEST(creation_time) ASC", [providerId]);
            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal[r] = new ProviderAddress().fromData(rdr.rows[r]);
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Checks if the the latitude and longitude coordinates already exist
     * @param {string} lat The latitude
     * @param {string} lon The longitude
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Boolean} The coordinates exist
     */
    async checkIfLatLonExists(lat, lon, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM provider_addresses WHERE latitude = $1 AND longitude = $2", [lat, lon]);
            if (rdr.rows.length == 0)
                return false;
            else
                return true;
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Query the database for the specified addresses
     * @param {*} filter The query template to use
     * @returns {*} The matching addresses
     */
    async query(filter, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            if (!filter || !filter.lat || !filter.lon)
                throw new exception.Exception("Missing latitude/longitude", exception.ErrorCodes.ARGUMENT_EXCEPTION);
            var sqlQuery = `
                SELECT addresses.*
                FROM (
                    SELECT *, 
                        (3959 * ACOS(COS(RADIANS($1)) * COS(RADIANS(provider_addresses.latitude)) 
                        * COS(RADIANS(provider_addresses.longitude) - RADIANS($2)) 
                        + SIN(RADIANS($1)) * SIN(RADIANS(provider_addresses.latitude))
                        )) AS distance 
                    FROM (
                        SELECT *
                        FROM provider_addresses
                        WHERE provider_addresses.latitude BETWEEN ($1::NUMERIC - $3::NUMERIC) AND ($1::NUMERIC + $3::NUMERIC)
                        AND provider_addresses.longitude BETWEEN ($2::NUMERIC - $3::NUMERIC) AND ($2::NUMERIC + $3::NUMERIC)
                        ) AS provider_addresses
                    ) AS addresses 
                INNER JOIN providers ON addresses.provider_id = providers.id
                WHERE distance <= $4
                AND addresses.deactivation_time IS NULL
                AND providers.deactivation_time IS NULL
                AND addresses.visible = true
                AND providers.visible = true`;

            var sqlArgs = [filter.lat, filter.lon, filter.distance * 0.02 || 0.5, filter.distance || 25, filter.limit || 25];
            if (filter.serviceType) {
                sqlQuery += `
                     AND addresses.id IN (SELECT provider_address_id FROM provider_address_types WHERE service_type = $6)`;
                sqlArgs.push(filter.serviceType);
            }

            sqlQuery += `
             ORDER BY distance ASC
             LIMIT $5;`;
            const rdr = await dbc.query(sqlQuery, sqlArgs);


            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal[r] = new ProviderAddress().fromData(rdr.rows[r]);
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Update the specified provider address
     * @param {ProviderAddress} address The instance of the provider address that is to be updated
     * @param {Principal} runAs The principal that is updating this provider address
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderAddress} The updated provider address data from the database
     */
    async update(address, runAs, _txc) {
        if (!address.id)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbAddress = address.toData();

            var updateCmd = model.Utils.generateUpdate(dbAddress, 'provider_addresses', 'updated_time');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Address Id does not exist", exception.ErrorCodes.DATA_ERROR);
            else
                return address.fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }
    }


    /**
     * @method
     * @summary Insert the specified provider address
     * @param {ProviderAddress} address The instance of the provider address that is to be inserted
     * @param {Principal} runAs The principal that is inserting this provider
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderAddress} The inserted provider address
     */
    async insert(address, runAs, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            var dbAddress = address.toData();
            delete (dbAddress.id);
            var updateCmd = model.Utils.generateInsert(dbAddress, 'provider_addresses');
            const rdr = await dbc.query(updateCmd.sql, updateCmd.args);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register provider address in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return address.fromData(rdr.rows[0]);
        }
        catch (e) {
            if (e.code == "23502")
                throw new exception.Exception("Missing mandatory field", exception.ErrorCodes.DATA_ERROR, e);
            throw e;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Gets the providers listed services types
     * @param {string} addressId The address Id
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The providers service types
     */
    async getAddressServiceTypes(addressId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT type_name AS name, description, service_types.id AS type_id FROM service_types JOIN provider_address_types ON provider_address_types.service_type = service_types.id WHERE provider_address_types.provider_address_id = $1", [addressId]);
            if (rdr.rows.length == 0)
                return null;
            else {
                var retVal = [];
                for (var r in rdr.rows)
                    retVal[r] = rdr.rows[r];
                return retVal;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Checks if an address has a specified service type
     * @param {string} addressId The address id
     * @param {string} typeId The service type id
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {*} The providers service types
     */
    async serviceTypeExists(addressId, typeId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM provider_addresses WHERE id = $1 AND id IN (SELECT provider_address_id FROM provider_address_types WHERE service_type = $2)", [addressId, typeId]);
            if (rdr.rows.length == 0)
                return false;
            else {
                return true;
            }
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Insert the specified service type for a provider
     * @param {string} addressId The address to add the service type to
     * @param {string} serviceTypeId The service type to add to the provider
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Boolean} The status of the insert
     */
    async insertServiceType(addressId, serviceTypeId, _txc) {
        if (!addressId || !serviceTypeId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();
            const rdr = await dbc.query("INSERT INTO provider_address_types (provider_address_id, service_type) VALUES ($1, $2) RETURNING *", [addressId, serviceTypeId]);

            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not register provider types in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return true;
        }
        catch (e) {
            if (e.code == "23502")
                throw new exception.Exception("Missing mandatory field", exception.ErrorCodes.DATA_ERROR, e);
            if (e.code == "23505")
                throw new exception.Exception("Provider type already exists", exception.ErrorCodes.DATA_ERROR, e);
            throw e;
        }
        finally {
            if (!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Delete a service type for a provider
     * @param {string} addressId The identity of the provider to delete the service type for
     * @param {string} serviceTypeId The service type to delete for the provider
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Boolean} The status of the delete
     */
    async deleteServiceType(addressId, serviceTypeId, _txc) {

        if (!addressId || !serviceTypeId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("DELETE FROM provider_address_types WHERE provider_address_id = $1 AND service_type = $2 RETURNING *", [addressId, serviceTypeId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not delete provider service type in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return true;
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

    /**
     * @method
     * @summary Delete / de-activate a provider address in the system
     * @param {string} addressId The identity of the provider to delete
     * @param {Principal} runAs The identity to run the operation as (for logging)
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {ProviderAddress} The deactivated provider address instance
     */
    async delete(addressId, runAs, _txc) {

        if (!addressId)
            throw new exception.Exception("Target object must carry an identifier", exception.ErrorCodes.ARGUMENT_EXCEPTION);

        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if (!_txc) await dbc.connect();

            const rdr = await dbc.query("UPDATE provider_addresses SET deactivation_time = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [addressId]);
            if (rdr.rows.length == 0)
                throw new exception.Exception("Could not DEACTIVATE provider address in data store", exception.ErrorCodes.DATA_ERROR);
            else
                return new ProviderAddress().fromData(rdr.rows[0]);
        }
        finally {
            if (!_txc) dbc.end();
        }

    }

}
