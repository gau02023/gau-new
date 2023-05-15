var express = require('express');
var router = express.Router();
var authJwt = require("../../middlewares/authJwt");

var ComplaintsController = require('../controllers/complaints.js');
var UserController = require("../controllers/user.js");

var Complaint = require('../models/complaints.js');

/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
const ObjectID = require('mongodb').ObjectId;

/******************* Add Complaint ***************************/
/*
    /complaints/postComplaint

*/
router.post('/postComplaint', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.userId = checkAuth.userId; }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        req.body.ngoId = findUser.ngoId._id;
        req.body.createdBy = checkAuth.userId;
        var requiredParamsArray = ["subject","description"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        var complaint = await ComplaintsController.postComplaint(req.body);
        return res.json({
            status: true,
            message: "Complaint registered",
            data: complaint
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
            message: error
        })
    }
});


/******************* Add Reply ***************************/
/*
    /complaints/reply

*/
router.post('/reply', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.userId = checkAuth.userId; }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        var requiredParamsArray = ["complaintId","reply"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        var findComplaint = await Complaint.findOne({_id: ObjectID(req.body.complaintId)});
        if (findComplaint) {
            if (req.body.reply) { findComplaint.reply = req.body.reply; }

        } else {
            return res.json({
                status: false,
                message: "No Project Found"
            })
        }
        await ComplaintsController.replyComplaint(req.body.complaintId, findComplaint);
        return res.json({
            status: true,
            message: "Reply sent",
            data: findComplaint
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
            message: error
        })
    }
});

/******************* List Comlaints ***************************/
/*
    /complaints/listComplaints

*/
router.get('/listComplaints', async function (req, res) {
    try {

        var complaintsList = [];
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        complaintsList = await ComplaintsController.listComplaints(checkAuth.userId, findUser.userType, findUser.ngoId._id);

        return res.json({
            status: true,
            message: "Data Fetched",
            data: complaintsList
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


module.exports = router;