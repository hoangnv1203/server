/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:txDbRetriever.js
 * Usage:Used to read records with 'status:ready" from db collection "callbackhashdb" and send details to callback URL and update 'status:sent'.This code runs every 10 seconds
 * Pending Items : 
 */
/*jshint esversion: 6 */
var timers = require("timers"),
    http = require("http"),
    ___backgroundTimer;
var mongoClient = require('mongodb').MongoClient;
var constants = require("config/constants");
var request = require('request');
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
                //Connect to db and fetch data
                mongoClient.connect(constants.MONGOURL, function(err, db) {
                    if (err) {
                        //db.close();
                        throw err;
                    } else {
                        var dbo = db.db(constants.DBNAME);
                        var query = {};
                        query["status"] = "new";
                        dbo.collection(constants.ELAHASHCOLLECTION).find(query).sort({
                            'timestamp': 1
                        }).limit(15).toArray(function(err, docs) {
                            var dbTxNewRecords = docs;
                            if (err) {
                                console.log("Error with connection from file txDBRetreiver.js")
                                db.close();
                                throw err;
                            }
                            if (dbTxNewRecords) {
                                for (var i = 0; i <= dbTxNewRecords.length - 1; i++) {
                                    txObject = dbTxNewRecords[i];
                                    var subQuery = {};
                                    var d = new Date();
                                    subQuery["txhash"] = docs[i].txhash;
                                    subQuery["type"] = "notcoinbase";
                                    dbo.collection(constants.ELABLOCKDB).find(subQuery).sort({
                                        'timestamp': 1
                                    }).toArray(function(err, details) {
                                        if (err) {
                                            console.log("Error with connection file txDBRetreiver.js")
                                            db.close();
                                            throw err;
                                        }
                                        if (details.length > 0) {
                                            var updateQuery = {
                                                txhash: details[0].txhash,
                                                status: "new"
                                            };
                                            var currenttimestamp = Math.floor(Date.now() / 1000);
                                            var updateInfo = {
                                                $set: {
                                                    timestamp: currenttimestamp,
                                                    status: "ready"
                                                }
                                            };
                                            //Update query to update status if found
                                            dbo.collection(constants.ELAHASHCOLLECTION).updateOne(updateQuery, updateInfo, function(err, res) {
                                                if (err) {
                                                    throw err;
                                                } else {
                                                    if (i == dbTxNewRecords.length - 1) {
                                                        checkedAll = true;
                                                    }
                                                    //delete txObject;
                                                }
                                                //db.close();
                                            });
                                        } else {
                                            db.close();
                                        }
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
                    console.log("File txDBRetreiver.js: retriever.js: shutdown timer...too many errors. " + err.message);
                    clearInterval(___backgroundTimer);
                    process.disconnect();
                } else {
                    console.log("File txDBRetreiver.js: retriever.js error: " + err.message + "\n" + err.stack);
                }
            }
        }, msg.interval);
    };
    this._init = function() {
        if (msg.content != null || msg.content != "" && msg.start == true) {
            this._startTimer();
        } else {
            console.log("File txDBRetreiver.js:  retriever.js: content empty. Unable to start timer.");
        }
    }.bind(this)()

})
process.on('uncaughtException', function(err) {
    console.log("retriever.js: " + err.message + "\n" + err.stack + "\n Stopping background timer");
    clearInterval(___backgroundTimer);
})