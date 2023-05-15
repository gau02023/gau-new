var express = require('express');
var router = express.Router();
var authJwt = require("../../middlewares/authJwt");

var LookupController = require('../controllers/lookup.js');
var GeneralDocumentController = require('../controllers/general_documents');
var UserController = require('../controllers/user');

var Lookup = require("../models/lookup.js");
var Document = require("../models/document.js");
var Schedule = require("../models/schedule");

/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
const GeneralDocumentModel = require('../models/general_documents');
const ObjectID = require('mongodb').ObjectId;

/******************* Add Lookup ***************************/
/*
    /lookup/addLookup

*/
router.post('/addLookup', async function (req, res) {
    try {
    const body = req.body;
    if(Object.keys(body).length === 0){
        var result = {status : false, message: "Please provide Fields required"};
        return res.json(result);
    }
    var lookup = await LookupController.addLookup(req.body);
    return res.json({
        status: true,
        message: "Lookup Created Successfully",
        data: lookup
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
/******************* Get Lookup By Type ***************************/
/*
    /lookup/getLookupByType/Type

*/
router.get('/getLookupByType/:Type', async function (req, res) {
    try {

        var lookupList = [];
        lookupList = await LookupController.getLookupByType(req.params.Type);

        return res.json({
            status: true,
            message: "Lookup Fetched Successfully",
            data: lookupList
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* Create Documents ***************************/
/*
    /api/lookup/createDocuments
*/
router.post("/createDocuments", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }

        var requiredParamsArray = ["lookupId","documentText"];
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        var findLookup = await Lookup.findOne({ _id: req.body.lookupId });
        if (!findLookup) {
            return res.json({ status: false, message: "Lookup not found" });
        }
        var findDocument = await Document.findOne({lookupId: ObjectID(req.body.lookupId), status : "active"});
        if(findDocument){
            return res.json({
                status: false,
                message: "Documents Already uploaded with this Lookup"
            })
        }
        var doc = await LookupController.createDocuments(req.body);
        return res.json({
            status: true,
            message: "Documents Uploaded Successfully"
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
            message: error.message
        })
    }
});

/******************* List Documents ***************************/
/*
    /api/lookup/listDocuments
*/
router.get('/listDocuments', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        return res.json({
            status: true,
            message: "Documents Fetched Successfully",
            data: await LookupController.listDocuments()
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* Get Document By Lookup ***************************/
/*
    /lookup/listDocumentByType/lookupId

*/
router.get('/listDocumentByType/:lookupId', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var document = await Document.findOne({lookupId: req.params.lookupId});
        return res.json({
            status: true,
            message: "Data Fetched Successfully",
            data: document
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* updateDocument Document ***************************/
/*
    /api/lookup/updateDocument

*/
router.post('/updateDocument', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findDocument = await Document.findOne({_id: ObjectID(req.body.documentId)});
        if (!findDocument) {
            return res.json({
                status: false,
                message: "Document Not Found"
            })
        }
        if(req.body.status != undefined){ findDocument.status = req.body.status; }
        if(req.body.documentText != undefined){ findDocument.documentText = req.body.documentText; }
        if(req.body.lookupId != undefined){ findDocument.lookupId = req.body.lookupId; }
        
        await Document.findByIdAndUpdate(req.body.documentId, findDocument);

        return res.json({
            status: true,
            message: "Document Deleted"
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error
        })
    }
});


/******************* Create Admin Documents ***************************/
/*
    /api/lookup/createAdminDocuments
*/
router.post("/createAdminDocuments", async (req, res) => {
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
        if(req.body.documents.length < 1){
            return res.json({ status: false, message: "Document is requried" });
        }
        let userId = checkAuth.userId;
        if(req.body.userId){
            userId = req.body.userId;
        }
        let status = "verified"
        if(findUser.userType == "user"){
            status = "unverified"
        }
        req.body.documents.forEach(async el => {
            var e = {
                documentTitle: el.documentTitle,
                documentURL: el.documentURL,
                expiryDate: el.expiryDate,
                createdBy: userId,
                ngoId: findUser.ngoId,
                status: status
            };
            await GeneralDocumentController.createDocuments(e);
        })
        return res.json({
            status: true,
            message: "Documents Added Successfully"
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
            message: error.message
        })
    }
});


/******************* Update Admin Documents ***************************/
/*
    /api/lookup/updateAdminDocuments
*/
router.post("/updateAdminDocuments", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }

        var findDocument = await GeneralDocumentModel.findOne({_id: ObjectID(req.body.documentId)});
        if (!findDocument) {
            return res.json({
                status: false,
                message: "Document Not Found"
            })
        }
        if(req.body.documentTitle != undefined){ findDocument.documentTitle = req.body.documentTitle; }
        if(req.body.documentURL != undefined){ findDocument.documentURL = req.body.documentURL; }
        if(req.body.expiryDate != undefined){ findDocument.expiryDate = req.body.expiryDate; }
        if(req.body.status != undefined){ findDocument.status = req.body.status; }
        
        await GeneralDocumentModel.findByIdAndUpdate(req.body.documentId, findDocument);
        return res.json({
            status: true,
            message: "Documents Updated Successfully"
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
            message: error.message
        })
    }
});

/******************* List General Documents ***************************/
/*
    /api/lookup/listGeneralDocuments
*/
router.get('/listGeneralDocuments', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        return res.json({
            status: true,
            message: "Documents Fetched Successfully",
            data: await GeneralDocumentController.listDocuments(findUser.userType,findUser.ngoId._id, checkAuth.userId)
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* updateDocument Document ***************************/
/*
    /api/lookup/deleteGeneralDocument

*/
router.get('/deleteGeneralDocument/:Id', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findDocument = await GeneralDocumentModel.findOne({_id: ObjectID(req.params.Id)});
        if (!findDocument) {
            return res.json({
                status: false,
                message: "Document Not Found"
            })
        }
        findDocument.status = "deleted"; 
        
        await GeneralDocumentModel.findByIdAndUpdate(req.params.Id, findDocument);

        return res.json({
            status: true,
            message: "Document Deleted"
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error
        })
    }
});


/******************* updateDocument Document ***************************/
/*
    /api/lookup/deleteGeneralDocument

*/
router.get('/scheduleFix', async (req, res) => {
    try {
       
        var getSchedule = await Schedule.find({scheduleStatus: "active"});
        getSchedule.forEach(async sch => {
            var spltStart = sch.timeStartSlot.toString().split(":")
            var spltEnd = sch.timeEndSlot.toString().split(":")
            sch.timeStartFirstHalf = parseInt(spltStart[0]);
            sch.timeEndFirstHalf = parseInt(spltEnd[0]);
            await sch.save();
        })

        return res.json({
            status: true,
            message: "Document Deleted"
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error
        })
    }
});



module.exports = router;