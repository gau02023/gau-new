var express = require('express');
var router = express.Router();
var authJwt = require("../../middlewares/authJwt");

var TranslationController = require('../controllers/translation');
var Translation = require('../models/translation');
var Lookup = require('../models/lookup');

/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
const ObjectID = require('mongodb').ObjectId;

/******************* Add Translation ***************************/
/*
    /translation/add

*/
router.post('/add', async function (req, res) {
    try {

        var requiredParamsArray = ["languageId", "actualText","translatedText"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        var findLookup = await Lookup.findOne({lookupType: "language", lookupName: "English"});
       
        await TranslationController.addTranslation(req.body);
        if(findLookup){
            var data = {
                languageId: findLookup._id,
                actualText: req.body.actualText,
                translatedText: req.body.actualText
            }
            await TranslationController.addTranslation(data);
        }
        return res.json({
            status: true,
            message: "Added"
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

/******************* List Translation ***************************/
/*
    /translation/list

*/
router.get('/list/:languageId', async function (req, res) {
    try {

        
        var languages = await TranslationController.listTranslation(req.params.languageId);
        var resp = [];
        languages.forEach(el => {
            var el = {
       
                actualText: el.actualText,
                translatedText: el.translatedText
            };
            resp.push(el)
        })
       var lng =  Object.assign({}, ...resp.map((x) => ({[x.actualText]: x.translatedText})));
        return res.json({
            status: true,
            message: "Data Fetched",
            data: lng
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* List Translation ***************************/
/*
    /translation/listAll

*/
router.get('/listAll', async function (req, res) {
    try {
        var languages = await TranslationController.listAllTranslation();
        
        return res.json({
            status: true,
            message: "Data Fetched",
            data: languages
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});



/******************* Edit Translation ***************************/
/*
    /api/translation/edit
*/
router.post("/edit", async (req, res) => {
    try {
        authJwt.verifyToken(req);
        var findTranslation = await Translation.findOne({_id: ObjectID(req.body.translationId)});
        if (findTranslation) {
            if (req.body.languageId) { findTranslation.languageId = req.body.languageId; }
            if (req.body.actualText) { findTranslation.actualText = req.body.actualText; }
            if (req.body.translatedText) { findTranslation.translatedText = req.body.translatedText; }
            if (req.body.status) { findTranslation.status = req.body.status; }

        } else {
            return res.json({
                status: false,
                message: "No Data Found"
            })
        }
        await TranslationController.updateTranslation(req.body.translationId, findTranslation);
        return res.json({
            status: true,
            message: "Updated Successfully",
            data: findTranslation
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



module.exports = router;