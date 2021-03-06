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

const request = require("request"),
    exception = require("../exception"),
    uhx = require("../uhx"),
    GoogleMapsAPI = require("googlemaps");

module.exports = class GoogleMaps {


    /**
    * @method
    * @summary Gets the latitude and longitude of an address
    * @param {Address} address The address to get the lat/lon for
    * @returns {Object} The latitude and longitude
    */
    async getLatLon(address) {

        var gm = new GoogleMapsAPI(uhx.Config.googleMaps);


        if (address instanceof Object) {
            if (address.country) {
                var country = await uhx.Repositories.countryRepository.getCountryByCode(address.country);
                if (!country) throw new exception.Exception("Invalid country code", exception.ErrorCodes.INVALID_NAME);
                else country = country.name;
            }
            var geocodeParams = { "address": `${address.street || ''} ${address.postalZip || ''} ${address.city || ''} ${address.stateProv || ''} ${country || address.country || ''}` };
        }
        else
            var geocodeParams = { "address": address };


        var retVal = {};
        return await new Promise((fulfill, reject) => {
            gm.geocode(geocodeParams, function (err, results) {
                if (results && results.status == "OK") {
                    retVal.lat = results.results[0].geometry.location.lat;
                    retVal.lon = results.results[0].geometry.location.lng;
                    fulfill(retVal);
                } else {
                    reject(new exception.Exception("An error has occurred: " + (err || results.error_message), exception.ErrorCodes.DATA_ERROR));
                }
            });
        });
        return retVal;
    }

    /**
    * @method
    * @summary Gets the distances for the addresses provided
    * @param {Address} origin The origin address
    * @param {Addresses} addresses The address to get distances of
    * @returns {Object} The latitude and longitude
    */
    async getDistances(origin, addresses) {
        var gm = new GoogleMapsAPI(uhx.Config.googleMaps);

        var distanceParams = {
            origins: origin,
            destinations: addresses.map((t) => { return `${t.latitude},${t.longitude}` }).join("|"),
            units: "metric"
        };

        return await new Promise((fulfill, reject) => {
            gm.distance(distanceParams, function (err, results) {
                if (results && results.status == "OK") {
                    try {
                        for (var address in addresses)
                            addresses[address].driving = results.rows[0].elements[address].duration ? results.rows[0].elements[address].duration.value : null;
                        fulfill(addresses);
                    } catch (ex) {
                        reject(new exception.Exception("Error getting distances: " + ex, exception.ErrorCodes.DATA_ERROR));
                    }
                }
                else {
                    reject(new exception.Exception("Error getting distances: " + err, exception.ErrorCodes.DATA_ERROR));
                }
            });
        });
        return addresses;
    }

    /**
    * @method
    * @summary Gets the place information for a latitude and longitude
    * @param {string} lat The latitude
    * @param {string} lon The longitude
    * @returns {Object} The place address of the latitude and longitude
    */
    async getPlace(lat, lon) {

        var gm = new GoogleMapsAPI(uhx.Config.googleMaps);

        var reverseGeocodeParams = {
            "latlng": lat + ',' + lon,
            "result_type": "postal_code", // By postal or zip rather then locality
            "language": "en",
            "location_type": "APPROXIMATE" // Less specific results
        };
        return await new Promise((fulfill, reject) => {
            gm.reverseGeocode(reverseGeocodeParams, function (err, results) {
                if (results && results.status == "OK") {
                    try {
                        if (results.results[0] && results.results[0].formatted_address)
                            fulfill(results.results[0].formatted_address);
                        else
                            fulfill(null);
                    } catch (ex) {
                        reject(new exception.Exception("Error getting address: " + ex, exception.ErrorCodes.DATA_ERROR));
                    }
                }
                else {
                    reject(new exception.Exception("Error getting address: " + err, exception.ErrorCodes.DATA_ERROR));
                }
            });
        });

        return address;
    }
}
