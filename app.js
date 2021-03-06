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

 const express = require('express'),
    bodyParser = require('body-parser'),
    exception = require('./exception'),
    uhx = require("./uhx"),
    api = require('./api'),
    oauth = require('./controllers/oauth'),
    purchase = require('./controllers/purchase'),
    user = require('./controllers/user'),
    patient = require('./controllers/patient'),
    provider = require('./controllers/provider'),
    providerAddress = require('./controllers/providerAddress'),
    providerService = require('./controllers/providerService'),
    serviceType = require('./controllers/serviceType'),
    wallet = require('./controllers/wallet'),
    group = require('./controllers/group'),
    invoice = require('./controllers/invoice'),
    permission = require('./controllers/permission'),
    asset = require('./controllers/asset'),
    invitation = require('./controllers/invitation'),
    transaction = require('./controllers/transaction'),
    careRelationship = require('./controllers/careRelationship'),
    carePlan = require('./controllers/carePlan'),
    reports = require('./controllers/stats'),
    swagger = require('./controllers/js-doc'),
    stellarFederation = require('./federation/stellar-fed.js'),
    airdrop = require('./controllers/airdrop'),
    subscription = require('./controllers/subscription'),
    offering = require('./controllers/offering'),
    toobusy = require('toobusy-js'),
    https = require('https'),
    helmet = require('helmet'),
    http = require('http'),
    skipper = require("skipper"),
    chat = require('./controllers/chat');
    
    toobusy.maxLag(10000);
// Startup application
const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(function(req, res, next) {
    if(toobusy())
        res.status(503).json(new exception.Exception("Server is too busy", exception.ErrorCodes.API_RATE_EXCEEDED));
    else
        next();
});
app.use(helmet());
app.use(skipper());

// Construct REST API
var restApi = new api.RestApi(uhx.Config.api.base, app);

// Add resources to rest API
if(uhx.Config.security.enableCors) {
    restApi.enableCors();
}
    

if(uhx.Config.swagger.enabled) {
    restApi.addResource(new swagger.SwaggerMetadataResource());
    app.use('/api-docs', express.static('api-docs'));
}

// Add OAuth token service
restApi.addResource(new oauth.OAuthTokenService());
restApi.addResource(new user.UserApiResource());
restApi.addResource(new patient.PatientApiResource());
restApi.addResource(new provider.ProviderApiResource());
restApi.addResource(new providerAddress.ProviderAddressApiResource());
restApi.addResource(new providerService.ProviderServiceApiResource());
restApi.addResource(new serviceType.ServiceTypeApiResource());
restApi.addResource(new purchase.PurchaseApiResource());
restApi.addResource(new invoice.InvoiceApiResource());
restApi.addResource(new wallet.WalletApiResource());
restApi.addResource(new group.GroupApiResource());
restApi.addResource(new permission.PermissionApiResource());
restApi.addResource(new asset.AssetApiResource());
restApi.addResource(new invitation.InvitationApiResource());
restApi.addResource(new carePlan.CarePlanApiResource());
restApi.addResource(new careRelationship.CareRelationshipApiResource());
restApi.addResource(new reports.StatisticsApiResource());
restApi.addResource(new transaction.TransactionApiResource());
restApi.addResource(new stellarFederation.StellarFederationApiResource());
restApi.addResource(new airdrop.AirdropApiResource());
restApi.addResource(new subscription.SubscriptionApiResource());
restApi.addResource(new offering.OfferingApiResource());
restApi.addResource(new chat.ChatApiResource());

uhx.init();
uhx.initWorker();
// Start REST API
restApi.start();

// Start the express instance
if(uhx.Config.api.scheme == "http") {
    const server = http.createServer(app).listen(uhx.Config.api.port);
    const io = require('socket.io')(server) 
    io.on('connection', (socket) => {
        console.log('-------------------Listening--------------------');

        socket.on('SEND_MESSAGE', async function(data){
          console.log(`sending`)
          //Emit to chat
          socket.broadcast.emit('RECEIVE_MESSAGE', {message: 'Send'});
        })
    });
}
else {
    const server = https.createServer(uhx.Config.api.tls, app).listen(uhx.Config.api.port);
    const io = require('socket.io')(server) 
    io.on('connection', (socket) => {
        console.log('-------------------Listening--------------------');

        socket.on('SEND_MESSAGE', async function(data){
          console.log(`sending`)
          //Emit to chat
          socket.broadcast.emit('RECEIVE_MESSAGE', {message: 'Send'});
        })
    });
}

uhx.log.info(`UHX API started on ${uhx.Config.api.scheme} port ${uhx.Config.api.port}`);
