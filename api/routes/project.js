var express = require('express');
var router = express.Router();
var authJwt = require("../../middlewares/authJwt");

var ProjectController = require('../controllers/project.js');
var UserController = require("../controllers/user.js");
var CaseController = require("../controllers/case");
var AppointmentController = require("../controllers/appointment");

var Project = require('../models/project.js');
/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
var caseResponseHelper = require("../../helpers/case.js");
var appointment = require("../../helpers/appointment");
const ObjectID = require('mongodb').ObjectId;

/******************* Add Project ***************************/
/*
    /project/create

*/
router.post('/create', async function (req, res) {
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
        var requiredParamsArray = ["projectName"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        var project = await ProjectController.addProject(req.body);
        return res.json({
            status: true,
            message: "Project Created",
            data: project
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

/******************* List Projects ***************************/
/*
    /project/listProjects

*/
router.get('/listProjects', async function (req, res) {
    try {

        var projectsList = [];
        var checkAuth = authJwt.verifyToken(req);
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        projectsList = await ProjectController.listProjects(findUser.ngoId._id);

        return res.json({
            status: true,
            message: "Data Fetched",
            data: await caseResponseHelper.generateProjectAllResponse(projectsList)
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* Edit Project ***************************/
/*
    /api/project/edit
*/
router.post("/edit", async (req, res) => {
    try {
        authJwt.verifyToken(req);
        var findProject = await Project.findOne({_id: ObjectID(req.body.projectId)});
        if (findProject) {
            if (req.body.projectName) { findProject.projectName = req.body.projectName; }
            if (req.body.description) { findProject.description = req.body.description; }
            if (req.body.startDate) { findProject.startDate = req.body.startDate; }
            if (req.body.endDate) { findProject.endDate = req.body.endDate; }
            if (req.body.status) { findProject.status = req.body.status; }

        } else {
            return res.json({
                status: false,
                message: "No Project Found"
            })
        }
        await ProjectController.updateProject(req.body.projectId, findProject);
        return res.json({
            status: true,
            message: "Project Updated Successfully",
            data: findProject
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


/******************* List Project Users ***************************/
/*
    /project/listProjectUsers/:projectId

*/
router.get('/listProjectUsers/:projectId', async function (req, res) {
    try {

        var projectsList = [];
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        projectsList = await CaseController.listProjectUsers(req.params.projectId);

        var resArr = [];
        projectsList.forEach(function(item){
          var i = resArr.findIndex(x => x.caseLinkedUser.toString() == item.caseLinkedUser.toString());
          if(i <= -1){
            resArr.push({caseLinkedUser: item.caseLinkedUser,
                projectId: item.projectId,
                caseNo: item.caseNo,
                caseName: item.caseName,
                createdDate: item.createdDate,
                Image: item.Image});
          }
        });
        return res.json({
            status: true,
            message: "Data Fetched",
            data: await caseResponseHelper.generateProjectUsersResponse(resArr)
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List Project Users ***************************/
/*
    /project/listProjectUsers/:projectId

*/
router.get('/listProjectAppointments/:projectId', async function (req, res) {
    try {

        var projectsList = [];
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        projectsList = await AppointmentController.listProjectAppointments(req.params.projectId);

        return res.json({
            status: true,
            message: "Data Fetched",
            data: await appointment.generateAppointmentResponse(projectsList)
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});



module.exports = router;