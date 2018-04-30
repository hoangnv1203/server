/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:subscribtiondetails.js
 * Usage:Subscribe WITH details like sender address,receiver address and amount to receive callback later.
 * Pending Items : Change Names to camelcasing like postSubscriptionDetails.js
 * Sample API POST : http://localhost:2045/subscribewithdetails
 * BODY
 *    {
        "senderaddress": "EYcUt6RAbKN22Z3xB45omEE3TEtppZxqQP",
        "receiveraddress" : "ELpYhM4PaM44ZZoDTDkv6biw2bmZ4RqCZd",
        "elaamount": "1",
        "callbackurl": "http://requestbin.fullcontact.com/12epgvq1"
      }
 */
/*jshint esversion: 6 */
var mongoClient = require('mongodb').MongoClient;
var fetch = require("node-fetch");
var constants = require("config/constants");


//Accept request and send response
exports.details = function(req, res) {
    if (typeof req.body.receiveraddress == 'undefined' || typeof req.body.senderaddress == 'undefined' || typeof req.body.callbackurl == 'undefined' || typeof req.body.elaamount == 'undefined') {
        res.status(404);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            status: "Not Success",
            action: "SunscribeWithTransactionDetails",
            status: "Required value such as Receiver Address or Sender Address or Callback URL or ela amount missing."
        }));
    } else {
        mongoClient.connect(constants.MONGOURL, function(err, db) {
            if (err) {
                throw err;
            } else {
                var dbo = db.db(constants.DBNAME);
                var currenttimestamp = Math.floor(Date.now() / 1000);
                var elasubhashObj = {
                    senderaddress: req.body.senderaddress,
                    receiveraddress: req.body.receiveraddress,
                    elaamount: req.body.elaamount,
                    callbackurl: req.body.callbackurl,
                    timestamp: currenttimestamp,
                    status: "new"
                };
                dbo.collection(constants.ELADETAILSCOLLECTIONDBCALL).insertOne(elasubhashObj, function(err, result) {
                    if (err) {
                        console.log("Error with connection from file : subscriptiondetail.js")
                        throw err;
                    } else {
                        db.close();
                        res.status(200);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({
                            status: "Success",
                            action: "SunscribeWithTransactionDetails",
                            details: "A callback request will be sent if there is a change in status of transaction you provided."
                        }));
                    }
                });
            }
        });
    }
};