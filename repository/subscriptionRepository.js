/// <Reference path="../model/model.js"/>
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
    moment = require('moment'),
    exception = require('../exception'),
    model = require('../model/model');

 /**
  * @class
  * @summary Represents the subscription repository logic
  */
 module.exports = class SubscriptionRepository {

    /**
     * @constructor
     * @summary Creates a new instance of the repository
     * @param {string} connectionString The path to the database this repository should use
     */
    constructor(connectionString) {
        this._connectionString = connectionString;
        this.get = this.get.bind(this);
        this.post = this.post.bind(this);
        this.update = this.update.bind(this);
        this.getSubscriptionsForDailyReport = this.getSubscriptionsForDailyReport.bind(this);
        this.getSubscriptionsForMonthlyReport = this.getSubscriptionsForMonthlyReport.bind(this);
    }

    /**
     * @method
     * @summary Retrieve the subscriptions from the database for a patient
     * @param {patientId} id Gets the specified patient's subscriptions
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions for the patient
     */
    async get(patientId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);

            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscription_lookup WHERE patient_id = $1", [patientId]);
            if(rdr.rows.length === 0)
                return [];
            else {
                const subscriptions = [];

                for (let i = 0; i < rdr.rows.length; i++) {
                    subscriptions.push(new model.Subscription().fromData(rdr.rows[i]))
                }

                return subscriptions;
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Adds a new subscription for the patient
     * @param {patientId} id The identifier for the patient that is making the subscription
     * @param {offeringId} id The identifier for the offering that the patient subscribed to
     * @param {autoRenew} bool The flag that represents if the subscription will renew automatically
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions for the patient
     */
    async post(patientId, offeringId, autoRenew, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);

        try {
            if(!_txc) await dbc.connect();
            const today = new Date();
            const offering = await dbc.query("SELECT * FROM offerings WHERE id = $1", [offeringId]);
            const nextPaymentDate = moment().add(offering.rows[0].period_in_months, 'months');

            const rdr = await dbc.query("INSERT INTO subscriptions (offering_id, patient_id, date_next_payment, date_subscribed, auto_renew) VALUES ($1, $2, $3, $4, $5) RETURNING *", [offeringId, patientId, nextPaymentDate, today, autoRenew]);
            
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', patientId);
            else {
                return new model.Subscription().fromData(rdr.rows[0]);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Updates a given subscription for a patient
     * @param {subscriptionId} id The identifier for the subscription to update
     * @param {offeringId} id The identifier for new offer the patient is subscribing to
     * @param {autoRenew} bool The flaf representing if the given subscription will renew automatically
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The updated subscriptions for the patinet
     */
    async update(subscriptionId, offeringId, autoRenew, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("UPDATE subscriptions SET offering_id = $1, auto_renew = $2 WHERE id = $3 RETURNING *", [offeringId, autoRenew, subscriptionId]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', patientId);
            else {
                return new model.Subscription().fromData(rdr.rows[0]);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Cancels a given subscription for a patient
     * @param {subscriptionId} id The identifier for the subscription to cancel
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The updated subscriptions for the patinet
     */
    async cancel(subscriptionId, _txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();

            const today = new Date();
            const rdr = await dbc.query("UPDATE subscriptions SET date_next_payment = null, date_terminated = $1 WHERE id = $2 RETURNING *", [today, subscriptionId]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', patientId);
            else {
                return new model.Subscription().fromData(rdr.rows[0]);
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a set of subscribers from the database that have current subscriptions for today
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions
     */
    async getSubscriptionsForDailyReport(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 1);

            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscriptions WHERE date_subscribed >= $1 AND date_terminated IS NULL OR date_terminated >= $1", [today]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No Subscriptions found.');
            else {
                const subscriptions = [];

                for (let i = 0; i < rdr.rows.length; i++) {
                    subscriptions.push(new model.Subscription().fromData(rdr.rows[i]))
                }

                return subscriptions;
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }

    /**
     * @method
     * @summary Retrieve a set of subscribers from the database that an active membership for the previous month
     * @param {Client} _txc The postgresql connection with an active transaction to run in
     * @returns {Subscription} The fetched subscriptions
     */
    async getSubscriptionsForMonthlyReport(_txc) {
        const dbc = _txc || new pg.Client(this._connectionString);
        try {
            if(!_txc) await dbc.connect();
            const rdr = await dbc.query("SELECT * FROM subscriptions WHERE date_terminated IS NULL OR date_terminated < $1", [new Date()]);
            if(rdr.rows.length === 0)
                throw new exception.NotFoundException('subscriptions', 'No Subscriptions found.');
            else {
                const subscriptions = [];

                for (let i = 0; i < rdr.rows.length; i++) {
                    subscriptions.push(new model.Subscription().fromData(rdr.rows[i]))
                }

                return subscriptions;
            }
        }
        finally {
            if(!_txc) dbc.end();
        }
    }
 }