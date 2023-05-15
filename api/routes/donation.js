var express = require('express');
var router = express.Router();
var authJwt = require("../../middlewares/authJwt");

var DonationController = require('../controllers/donation.js');
var UserController = require("../controllers/user.js");

/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
const ObjectID = require('mongodb').ObjectId;

/******************* Add Donation ***************************/
/*
    /donation/donate

*/
router.post('/donate', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        req.body.ngoId = findUser.ngoId._id;
        var requiredParamsArray = ["userId", "amount", "description"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        var donation = await DonationController.addDonation(req.body);
        return res.json({
            status: true,
            message: "Amount donated",
            data: donation
        })
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.json({
                status: false,
                message: errorMessages.ValidationErrors(error)
            })
        }
        else if (error.name === "MongoError") {
            return res.json({
                status: false,
                message: errorMessages.customValidationMessage(error)
            })
        }
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* List Donations ***************************/
/*
    /donation/listDonation

*/
router.get('/listDonation', async function (req, res) {
    try {

        var donationList = [];
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        donationList = await DonationController.listDonation(checkAuth.userId, findUser.userType, findUser.ngoId._id);

        return res.json({
            status: true,
            message: "Data Fetched",
            data: donationList
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


module.exports = router;