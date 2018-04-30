/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:detailsDbretriever.js
 * Usage:Used to read records with 'status:new" from db collection "callbackhashdetails" and send update stuas:ready if present in "elablockdb" collection so that "detailsCallbackPost.js" can pick those items and send POST call to callback url.
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
                        //db.close();
                        throw err;
                    } else {
                        var dbo = db.db(constants.DBNAME);
                        var query = {};
                        query["status"] = "new";
                        //Fetch records from DB with 'status:new:
                        dbo.collection(constants.ELADETAILSCOLLECTIONDBCALL).find(query).sort({
                            'timestamp': 1
                        }).limit(15).toArray(function(err, docs) {
                            var dbTxNewRecords = docs;
                            var count = dbTxNewRecords.length - 1;
                            var checker = 0;
                            if (err) {
                                console.log("Error with connection from file detailsDbRetriever.js")
                                db.close();
                                throw err;
                            }
                            if (dbTxNewRecords.length > 0) {
                                for (var i = 0; i <= dbTxNewRecords.length - 1; i++) {
                                    checker = i;
                                    var subQuery = {};
                                    var d = new Date();
                                    subQuery["senderAddress"] = dbTxNewRecords[i].senderaddress;
                                    subQuery["receiverAddress"] = dbTxNewRecords[i].receiveraddress;
                                    subQuery["amount"] = dbTxNewRecords[i].elaamount;
                                    dbo.collection(constants.ELABLOCKDB).find(subQuery).sort({
                                        'timestamp': 1
                                    }).toArray(function(err, details) {
                                        if (err) {
                                            console.log("Error with connection from file detailsDbRetriever.js")
                                            db.close();
                                            throw err;
                                        }
                                        if (details) {
                                            if (details.length == 0) {
                                                //Do Nothing.
                                            } else {
                                                //for loop to concatinate multiple tx hash for same address,money
                                                var multipleHash = [];
                                                if (details.length > 1) {
                                                    for (var k = 0; k <= details.length - 1; k++) {
                                                        var url = constants.BCEXPLORERURL+constants.ELATXPAGELOCATION+details[k].txhash;
                                                        multipleHash.push({
                                                            "txhash": details[k].txhash,
                                                            block: details[k].blockcheight,
                                                            timestamp: details[k].timestamp,
                                                            url: url,
                                                            amount: details[k].amount
                                                        });
                                                    }
                                                } else {
                                                    //Do Nothing
                                                }
                                                for (var j = 0; j <= details.length - 1; j++) {
                                                    //Update DB Records
                                                    var currenttimestamp = Math.floor(Date.now() / 1000);
                                                    if (multipleHash.length == 0) {
                                                        var url = constants.BCEXPLORERURL +constants.ELATXPAGELOCATION+details[j].txhash;
                                                        var updateInfo = {
                                                            $set: {
                                                                timestamp: currenttimestamp,
                                                                status: "ready",
                                                                txhash: [{
                                                                    txhash: details[j].txhash,
                                                                    block: details[j].blockcheight,
                                                                    timestamp: details[j].timestamp,
                                                                    url: url,
                                                                    amount: details[j].amount
                                                                }]
                                                            }
                                                        };
                                                    } else {
                                                        var updateInfo = {
                                                            $set: {
                                                                timestamp: currenttimestamp,
                                                                status: "ready",
                                                                txhash: multipleHash
                                                            }
                                                        };
                                                    }
                                                    var updateInfoQuery = {};
                                                    updateInfoQuery["senderaddress"] = details[j].senderAddress;
                                                    updateInfoQuery["receiveraddress"] = details[j].receiverAddress;
                                                    updateInfoQuery["elaamount"] = details[j].amount;
                                                    updateInfoQuery["status"] = "new";
                                                    //Update records status:ready so that "detailsCallbackPost.js" will send to callback api/url
                                                    dbo.collection(constants.ELADETAILSCOLLECTIONDBCALL).update(updateInfoQuery, updateInfo, function(err, res) {
                                                        if (err) {
                                                            throw err;
                                                            console.log("File detailsDBRetriever:" + err);
                                                            db.close();
                                                        } else {
                                                            if (count == checker) {
                                                                checkedAll = true;
                                                            }
                                                        }
                                                    });
                                                }
                                            }
                                        } else {
                                            db.close();
                                        }
                                    });
                                    if (checkedAll) {
                                        //db.close();
                                    }
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
                    console.log("File  detailsDbRetriever.js shutdown timer...too many errors in file from file detailsDbRetriever.js" + err.message);
                    clearInterval(___backgroundTimer);
                    process.disconnect();
                } else {
                    console.log("File detailsDbRetriever.js  error: in file from file detailsDbRetriever.js" + err.message + "\n " + err.stack);
                }
            }
        }, msg.interval);
    };
    this._init = function() {
        if (msg.content != null || msg.content != "" && msg.start == true) {
            this._startTimer();
        } else {
            console.log("File  detailsDbRetriever.js : content empty. Unable to start timer in file from file detailsDbRetriever.js");
        }
    }.bind(this)()
})
process.on('uncaughtException', function(err) {
    console.log("File  detailsDbRetriever.js : " + err.message + "\n" + err.stack + "\n Stopping background timer in file from file detailsDbRetriever.js");
    clearInterval(___backgroundTimer);
})