/*
 * Developed by :HT
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:querytx.js
 * Usage:Check if tx is present in blockchain using txhash.If found send back details.
 * Pending Items : Change Names to camelcasing like getQueryTx.js
 * Sample API get : http://localhost:3001/api/gettxdetails/?txhash=cb6063a82b1858ad1eb7f8bb53facae885771b3de7bb4dc493529f998dd17b6d
 */
/*jshint esversion: 6 */
var fetch = require("node-fetch");
var constants = require("config/constants");


//Get Request and Send Response
exports.details = function(req, res) {
    var txHashUrl = constants.ELAAPIURL+ constants.TXLOCATION + req.query.txhash;
    if (typeof req.query.txhash == 'undefined') {
        res.status(404);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            details: "Required txhash Missing",
            status: "Not Success",
            action: "GetTransactionDetails"
        }));
    } else {
        fetch(txHashUrl)
            .then((response) => response.json())
            .then(function(data) {
                if (data.Error == "42002") {
                    res.status(404);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({
                        status: "Not Success",
                        action: "GetTransactionDetails",
                        details: "TX hash is in-valid"
                    }));
                } else {
                    res.status(200);
                    res.setHeader('Content-Type', 'application/json');
                    var trackURL = constants.BCEXPLORERURL + constants.ELATXPAGELOCATION + req.query.txhash;
                    res.send(JSON.stringify({
                        status: "Success",
                        action: "GetTransactionDetails",
                        txHash: req.query.txhash,
                        trackingURL: trackURL,
                        confirmations: data.confirmations,
                        blockHeight: data.blockheight,
                        time: data.time,
                        blockHash: data.blockhash
                    }));
                }

            })
            .catch(function(error) {
                const status = error.response ? error.response.status : 500
                if (status === 404) {
                    res.status(404);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({
                        status: "Not Success",
                        action: "GetTransactionDetails",
                        details: "TX hash is in-valid or not presnt in blockkhain yet"
                    }));
                } else {
                    res.status(404);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({
                        status: "Not Success",
                        action: "GetTransactionDetails",
                        details: "TX hash is in-valid or not presnt in blockkhain yet"
                    }));
                }
            });
    }
};