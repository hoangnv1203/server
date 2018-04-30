/*
 * Developed by :HT
 * Last Updated by :
 * Developed on :04/25/2018
 * Code Reviewers : Noah and Song
 * FileName:constants.js
 * Usage:Used to store global constants.
 * Pending Items :
 * Notes:
 *     ELATOUSDFREQUENCYINTERVAL : In minutes (2)
 *     BACKGROUNDJOBSTIMEINTERVAL : In milli seconds(10*1000 = 10,000)
 *     USDTOCURRENCYFREQUENCYINTERVAL : In days (1)
 *
 */
module.exports = Object.freeze({
    MONGOURL : "mongodb://localhost/",
    BCEXPLORERURL : "http://blockchain-test-05.eadd.co",
    ELAAPIURL  : "http://api-test-05.eadd.co:22334",
    CURRENCYURL : "http://www.apilayer.net/api/live?access_key=3e237efb6e565d8836feb494f3d9bbe0&format=1",
    HUOBIURL : "https://api.huobipro.com/market/detail?symbol=elausdt",
    ELATXPAGELOCATION : "/tx/",
    TXLOCATION : "/api/v1/transaction/",
    BLOCKHEIGHTLOCATION: "/api/v1/block/height",
    BLOCKHEIGHTDETAILLOCATION: "/api/v1/block/details/height/",
    DBNAME : "elaPay",
    ELADETAILSCOLLECTIONDBCALL : "callbackhashdetails",
    ELABLOCKDB : "elablockdb",
    ELAHASHCOLLECTION : "callbackhashdb",
    COLLECTIONNAME : "exchangeRatedb",
    ELAUSDCOLLECTIONNAME : "USDELAConversionRatedb",
    BACKGROUNDJOBSTIMEINTERVAL : 10000,
    USDTOCURRENCYFREQUENCYINTERVAL : 1,
    ELATOUSDFREQUENCYINTERVAL : 2
});
