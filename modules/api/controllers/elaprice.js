/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:elaprice.js
 * Usage:Used to convert USD to ELA or any supported currency.
 * Pending Items : Change Names to camelcasing like getElaPrice.js,Use one function to get time,seconds by passing params.
 * Sample API get :http://localhost:3001/api/getamountinela/?symbol=CNY&amount=123
 * Notes:
 *  * Send symbol in UPPER CASE/CAPITAL LETTERS
 *  * Send  amount after checking if its a number/decimal ONLY
 */
/*
/*jshint esversion: 6 */
var validateCurrencyCode = require('validate-currency-code');
var mongoClient = require('mongodb').MongoClient;
var fetch = require("node-fetch");
var constants = require("config/constants");
var response;

//Save Currency Pairs to DB
function saveCurrencyPairsToDB(currencyCode, amount) {
    //Check if Currency Pair exists in db and is less than 24 hrs and return price
    var excahngeRateInUSD = 0;
    //Connect to DB
    mongoClient.connect(constants.MONGOURL, function(err, db) {
        if (err) {
            throw err;
        } else {
            var dbo = db.db(constants.DBNAME);
            var query = {};
            query["keypair"] = "USD" + currencyCode;
            dbo.collection(constants.COLLECTIONNAME).findOne(query, function(err, result) {
                if (err) {
                    console.log("Error with connection in file elaprice.js")
                    throw err;
                }
                if (result) {
                    //Check if the result is less than 24 hrs
                    if (checkTimeStamps(result.timestamp) < constants.USDTOCURRENCYFREQUENCYINTERVAL) {
                        //Call huobi for rate
                        huobiCall(amount / result.value, dbo, db);
                    } else {
                        fetchExchangeRateFromAPI("USD" + currencyCode, dbo, db, amount);
                    }
                } else {
                    fetchExchangeRateFromAPI("USD" + currencyCode, dbo, db, amount);
                }
            });
        }
    });
}

//Fetch excchange rate from Huobi
function fetchExchangeRateFromAPI(currencyCode, dbo, db, amount) {
    // Perform API Call to get new conversion rate
    var currentExchangeRate = 0;
    fetch(constants.CURRENCYURL)
        .then((response) => response.json())
        .then(function(data) {
            let currencyQuoteData = data.quotes;
            let exchangeTimeStamp = data.timestamp;
            //Frame JSON Object
            var quotes = [];
            var inputData = currencyQuoteData;
            for (var key in inputData) {
                if (inputData.hasOwnProperty(key)) {
                    quotes.push({
                        "keypair": key,
                        "value": inputData[key],
                        "timestamp": exchangeTimeStamp
                    });
                    if (key == currencyCode) {
                        currentExchangeRate = inputData[key];
                    }
                }
            }
            //Save the data to db
            dbo.collection(constants.COLLECTIONNAME).remove({}, function(err, result) {
                if (err) {
                    throw err;
                } else {
                    dbo.collection(constants.COLLECTIONNAME).insertMany(quotes, function(err, res) {
                        if (err) {
                            throw err;
                        } else {
                            //Do Nothing
                            huobiCall(amount / currentExchangeRate, dbo, db);
                        }
                    });
                }
            });
        })
        .catch(function(error) {
            console.log("Error in file elaprice.js" + error);
        });
}
//Get Time in days difference
function checkTimeStamps(currenyTimeStamp) {
    var currentTime = Math.floor(Date.now() / 1000);
    var secdiff = currentTime - currenyTimeStamp;
    var mindiff = Math.floor(secdiff / 60);
    secdiff = secdiff % 60;
    var hourdiff = Math.floor(mindiff / 60);
    mindiff = mindiff % 60;
    var daydiff = Math.floor(hourdiff / 24);
    hourdiff = hourdiff % 24;
    return daydiff;
}

//Get Time in Minutes Difference
function checkTimeStampsSecondDiff(currenyTimeStamp) {
    var currentTime = Math.floor(Date.now() / 1000);
    var secdiff = currentTime - currenyTimeStamp;
    var mindiff = Math.floor(secdiff / 60);
    secdiff = secdiff % 60;
    var hourdiff = Math.floor(mindiff / 60);
    mindiff = mindiff % 60;
    var daydiff = Math.floor(hourdiff / 24);
    hourdiff = hourdiff % 24;
    return mindiff;
}

//Call and save
function huobiCall(usdvalue, dbo, db) {
    //https://api.huobipro.com/market/detail?symbol=elausdt
    //Check if rate exists in DB for the past 60 Seconds
    var query = {};
    query["keypair"] = "USDELA";
    dbo.collection(constants.ELAUSDCOLLECTIONNAME).findOne(query, function(err, result) {
        if (err) {
            throw err;
        }
        if (result) {
            //Check if the result is less than 24 hrs
            if (checkTimeStampsSecondDiff(result.timestamp) < constants.ELATOUSDFREQUENCYINTERVAL) {
                returnResults(usdvalue / result.value, result.value, result.timestamp);
            } else {
                callHuobiAPI(usdvalue, dbo, db);
            }
        } else {

            callHuobiAPI(usdvalue, dbo, db);
        }
    });
}
//Call Huobi API to get current ELAUSDT rate
function callHuobiAPI(usdvalue, dbo, db) {
    //Make first API Call
    let elaUsdPrice = 0;
    let huobiTimeStamp;
    fetch(constants.HUOBIURL)
        .then((response) => response.json())
        .then(function(data) {
            elaUsdPrice = data.tick.close;
            huobiTimeStamp = Math.floor(Date.now() / 1000);
            var elaObj = {
                keypair: "USDELA",
                value: elaUsdPrice,
                timestamp: huobiTimeStamp
            };
            //Save the data to db
            dbo.collection(constants.ELAUSDCOLLECTIONNAME).remove({}, function(err, result) {
                if (err) {
                    throw err;
                } else {
                    dbo.collection(constants.ELAUSDCOLLECTIONNAME).insertOne(elaObj, function(err, res) {
                        if (err) {
                            throw err;
                        } else {
                            returnResults(usdvalue / elaUsdPrice, elaUsdPrice, huobiTimeStamp);
                            db.close();
                        }
                    });
                }
            });
        })
}

//Send back results
function returnResults(rate, usdela, time) {
    response.status(200);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        status: "Success",
        action: "GetAmountInELA",
        elaAmount: rate,
        exchangeRate: usdela,
        queryTime: time
    }));
}

//Return response here.
exports.details = function(req, res) {
    var currencyCode = req.query.symbol;
    var amount = req.query.amount;
    if (typeof currencyCode !== 'undefined' && typeof amount !== 'undefined') {
        if (validateCurrencyCode(currencyCode)) {
            response = res;
            if (currencyCode !== "USD") {
                var rate = saveCurrencyPairsToDB(currencyCode, amount);
            } else {
                //Currency is USD
                mongoClient.connect(constants.MONGOURL, function(err, db) {
                    if (err) {
                        throw err;
                    } else {
                        var dbo = db.db(constants.DBNAME);
                        huobiCall(amount, dbo, db);
                    }
                });
            }
        } else {
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({
                status: "Not Success",
                action: "GetAmountInELA",
                details: "Invalid currency code."
            }));
        }
    } else {
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            status: "Not Success",
            action: "GetAmountInELA",
            details: "Required Params such as  symbol AND/OR amount is missing."
        }));
    }
};