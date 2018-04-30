/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:detailsCallbackPost.js
 * Usage:Used to read records with 'status:ready" from db collection "callbackhashdetails" and send details to callback URL and update 'status:sent'.This code runs every 10 seconds
 * Pending Items : 
 */
/*jshint esversion: 6 */
var timers = require("timers"),
    http = require("http"),
    ___backgroundTimer;
var mongoClient = require('mongodb').MongoClient;
var request = require('request');
var fetch = require("node-fetch");
var constants = require("config/constants");
var checkedAll = false;
var txObject;

//Here we start batch job
process.on('message', function(msg) {
    this._startTimer = function() {
        var count = 0;
        ___backgroundTimer = timers.setInterval(function() {
            try {
                var date = new Date();
                mongoClient.connect(constants.MONGOURL, function(err, db) {
                    if (err) {
                        throw err;
                    } else {
                        var dbo = db.db(constants.DBNAME);
                        var query = {};
                        var d = new Date();
                        query["status"] = "ready";
                        //Fetch db records that have status ready
                        dbo.collection(constants.ELADETAILSCOLLECTIONDBCALL).find(query).sort({
                            'timestamp': 1
                        }).limit(15).toArray(function(err, docs) {
                            var dbTxNewRecords = docs;
                            if (err) {
                                console.log("Error with connection from file detailsCallbackPost.js")
                                db.close();
                                throw err;
                            }
                            if (dbTxNewRecords) {
                                for (var i = 0; i <= dbTxNewRecords.length - 1; i++) {
                                    txObject = dbTxNewRecords[i];
                                    var callbackURL = dbTxNewRecords[i].callbackurl;
                                    var txHashToSend = dbTxNewRecords[i].txhash;
                                    var senderAddress = dbTxNewRecords[i].senderaddress;
                                    var receiverAddress = dbTxNewRecords[i].receiveraddress;
                                    var amount = dbTxNewRecords[i].elaamount;
                                    //POST Details to call back URL
                                    request.post({
                                        headers: {
                                            'content-type': 'application/json'
                                        },
                                        status: 200,
                                        url: dbTxNewRecords[i].callbackurl,
                                        body: JSON.stringify({
                                            transactionHash: dbTxNewRecords[i].txhash,
                                            receiverAddress: dbTxNewRecords[i].receiveraddress,
                                            senderAddress: dbTxNewRecords[i].senderaddress,
                                            status: " Success",
                                            action: "GetTransactionsDetailsByDetailsToCallbackURL"
                                        })
                                    }, function(error, response, body) {
                                        //Update record stauts:sent in DB collection
                                        var updateQuery = {
                                            txhash: txHashToSend,
                                            status: "ready",
                                            senderaddress: senderAddress,
                                            receiveraddress: receiverAddress,
                                            elaamount: amount
                                        };
                                        var currenttimestamp = Math.floor(Date.now() / 1000);
                                        var updateInfo = {
                                            $set: {
                                                timestamp: currenttimestamp,
                                                status: "sent"
                                            }
                                        };
                                        dbo.collection(constants.ELADETAILSCOLLECTIONDBCALL).updateOne(updateQuery, updateInfo, function(err, res) {
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
                    console.log("File  detailsCallbackPost.js : shutdown timer...too many errors in file detailsCallbackPost.js" + err.message);
                    clearInterval(___backgroundTimer);
                    process.disconnect();
                } else {
                    console.log("File  detailsCallbackPost.js  :error in file  detailsCallbackPost.js: " + err.message + "\n" + err.stack);
                }
            }
        }, msg.interval);
    };
    this._init = function() {
        if (msg.content != null || msg.content != "" && msg.start == true) {
            this._startTimer();
        } else {
            console.log("File  detailsCallbackPost.js : content empty. Unable to start timer");
        }
    }.bind(this)()
})
process.on('uncaughtException', function(err) {
    console.log("File  detailsCallbackPost.js  :" + err.message + "\n" + err.stack + "\n Stopping background timer in file  from file detailsCallbackPost.js");
    clearInterval(___backgroundTimer);
})