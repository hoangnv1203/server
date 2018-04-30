/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:subscribtionhash.js
 * Usage:Subscribe with hash and get a response back later to callback URL.
 * Pending Items : Change Names to camelcasing like postSubscriptionDetails.js
 * Sample API POST : http://localhost:2036/api/posttxdetailsforcallback
 * BODY
 *    {
        "txhash": "a1d6b0683af51cde18f095429e359f3f0b837e097d13bc49438c85e69f537bc3",
        "callbackurl": "http://localhost:2037/querytx/?txhash=a1d6b0683af51cde18f095429e359f3f0b837e097d13bc49438c85e69f537bc3"

      }
 */
/*jshint esversion: 6 */
var mongoClient = require('mongodb').MongoClient;
var fetch = require("node-fetch");
var constants = require("config/constants");


//Get details and send response
exports.details = function(req, res) {
    console.log("Request came in");
    //var txHashUrl = elaHostURL+txLocation+req.query.txhash;
    if (typeof req.body.txhash == 'undefined' || typeof req.body.callbackurl == 'undefined') {
        res.status(404);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            action: "SubscribeWithTransactionHash",
            status: "Not Success",
            details: "Required value such as Transaction hash or callbackURL is Missing in body"
        }));
    } else {
        mongoClient.connect(constants.MONGOURL, function(err, db) {
            if (err) {
                throw err;
            } else {
                var dbo = db.db(constants.DBNAME);
                var currenttimestamp = Math.floor(Date.now() / 1000);
                var elasubhashObj = {
                    txhash: req.body.txhash,
                    callbackurl: req.body.callbackurl,
                    timestamp: currenttimestamp,
                    status: "new"
                };
                dbo.collection(constants.ELAHASHCOLLECTION).insertOne(elasubhashObj, function(err, result) {
                    if (err) {
                        console.log("Error with connection 3")
                        throw err;
                    } else {
                        db.close();
                        res.status(200);
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({
                            status: "success",
                            action: "SubscribeWithTransactionHash",
                            details: "A callback request will be sent if there is a change in status of transaction hash provided."
                        }));
                    }
                });
            }
        });
    }
};