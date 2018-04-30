/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:txCallbackPost.js
 * Usage:Used to read records with 'status:ready" from db collection "callbackhashdb" and send details to callback URL and update 'status:sent'.This code runs every 10 seconds
 * Pending Items : 
 */
/*jshint esversion: 6 */
var timers = require("timers"),
    http = require("http"),
    ___backgroundTimer;
var mongoClient = require('mongodb').MongoClient;
var constants = require("config/constants");
var fetch = require("node-fetch");
var checkedAll = false;
var txObject;


//Here we start batch job
process.on('message', function(msg) {
    this._startTimer = function() {
        var count = 0;
        ___backgroundTimer = timers.setInterval(function() {
            try {
                var date = new Date();
                var request = require('request');
                mongoClient.connect(constants.MONGOURL, function(err, db) {
                    if (err) {
                        throw err;
                    } else {
                        var dbo = db.db(constants.DBNAME);
                        var query = {};
                        var d = new Date();
                        query["status"] = "ready";
                        dbo.collection(constants.ELAHASHCOLLECTION).find(query).sort({
                            'timestamp': 1
                        }).limit(15).toArray(function(err, docs) {
                            var dbTxNewRecords = docs;
                            if (err) {
                                console.log("From File txCallbackPost.js:Error with connection")
                                db.close();
                                throw err;
                            }
                            if (dbTxNewRecords.length > 0) {
                                for (var i = 0; i <= dbTxNewRecords.length - 1; i++) {
                                    txObject = dbTxNewRecords[i];
                                    var request = require('request');
                                    var callbackURL = dbTxNewRecords[i].callbackurl;
                                    var trackURL = constants.BCEXPLORERURL + constants.ELATXPAGELOCATION + dbTxNewRecords[i].txhash;
                                    var txHashToSend = dbTxNewRecords[i].txhash;
                                    request.post({
                                        headers: {
                                            'content-type': 'application/json'
                                        },
                                        status: 200,
                                        url: dbTxNewRecords[i].callbackurl,
                                        body: JSON.stringify({
                                            transactionHash: dbTxNewRecords[i].txhash,
                                            trackingURL: trackURL,
                                            details: "Transaction is now present in blockchain",
                                            status: " Success",
                                            action: "GetTransactionsDetailsByHashToCallbackURL"
                                        })
                                    }, function(error, response, body) {
                                        //Update record in DB
                                        var updateQuery = {
                                            txhash: txHashToSend,
                                            status: "ready"
                                        };
                                        var currenttimestamp = Math.floor(Date.now() / 1000);
                                        var updateInfo = {
                                            $set: {
                                                timestamp: currenttimestamp,
                                                status: "sent"
                                            }
                                        };
                                        dbo.collection(constants.ELAHASHCOLLECTION).updateOne(updateQuery, updateInfo, function(err, res) {
                                            if (err) {
                                                throw err;
                                            } else {
                                                if (i == dbTxNewRecords.length - 1) {
                                                    checkedAll = true;
                                                }
                                            }
                                            //db.close();
                                        });
                                    });
                                }
                                if (checkedAll) {
                                    db.close();
                                }
                            } else {
                                db.close();
                            }
                        });
                    }
                });
                //process.send("msg.content");
            } catch (err) {
                count++;
                if (count == 3) {
                    console.log("File txCallbackPost.js :  shutdown timer...too many errors. " + err.message);
                    clearInterval(___backgroundTimer);
                    process.disconnect();
                } else {
                    console.log("File txCallbackPost.js" + err.message + "\n" + err.stack);
                }
            }
        }, msg.interval);
    };
    this._init = function() {
        if (msg.content != null || msg.content != "" && msg.start == true) {
            this._startTimer();
        } else {
            console.log("File txCallbackPost.js :retriever.js: content empty. Unable to start timer.");
        }
    }.bind(this)()
})
process.on('uncaughtException', function(err) {
    console.log("File txCallbackPost.js : retriever.js: " + err.message + "\n" + err.stack + "\n Stopping background timer");
    clearInterval(___backgroundTimer);
})