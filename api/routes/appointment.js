require("dotenv").config();
var express = require("express");
var jwt = require('jsonwebtoken');
var router = express.Router();

var ScheduleController = require("../controllers/schedule.js");
var UserController = require("../controllers/user.js");
var AppointmentController = require("../controllers/appointment.js");

var Appointment = require("../models/appointment.js");
var User = require("../models/user.js");
var Project = require("../models/project.js");


/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
var caseHelper = require("../../helpers/caseNo");
var appointment = require("../../helpers/appointment");

var authJwt = require("../../middlewares/authJwt");
const ObjectID = require('mongodb').ObjectId;


/******************* Create Appointment ***************************/
/*
    /api/appointment/create
*/
router.post("/create", async (req, res) => {
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
        if(findUser.userType != "user"){
            var findProject = await Project.findOne({ _id: req.body.projectId });
            if (!findProject) {
                return res.json({
                    status: false,
                    message: "Project Required"
                })
            }
        }

        req.body.ngoId = findUser.ngoId._id;
        var checkSchedule = await ScheduleController.getScheduleById(req.body.scheduleId)
        if (!checkSchedule) {
            return res.json({
                status: false,
                message: "No Schedule Found for this user"
            })
        }
        var findPreviousAppointment = await Appointment.findOne({ scheduleId: req.body.scheduleId, appointmentStatus : {$ne : 'cancelled'} });
        if (findPreviousAppointment) {
            return res.json({
                status: false,
                message: "Appointment Already scheduled in current Date and Time Slot"
            })
        }

        if (req.body.previousAppointmentLinked == true) {
            var findPreviousAppointment = await Appointment.findOne({ _id: req.body.previousAppointmentLinkedId });
            if (!findPreviousAppointment) {
                return res.json({
                    status: false,
                    message: "No previous Appointment found Against this ID"
                })
            }
            if(findUser.userType != "user"){
                req.body.caseName = findPreviousAppointment.caseName;
                req.body.caseNo = findPreviousAppointment.caseNo;
            }
             var requiredParamsArray = ["previousAppointmentLinkedId", "appointmentUser", "appointmentWith","scheduleId","projectId"]
             var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
             if (checkParams.status) {
                 return res.json({ status: false, message: checkParams.missingParam });
             }
        } else {
            var requiredParamsArray =  [];
            if(findUser.userType == "user"){
                requiredParamsArray = ["appointmentUser", "appointmentWith", "scheduleId"];
            } else {
                requiredParamsArray = ["appointmentUser", "appointmentWith", "scheduleId","caseName","projectId"];
                req.body.caseNo = caseHelper.generateCaseNo(6);
            }

            var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
            if (checkParams.status) {
                return res.json({ status: false, message: checkParams.missingParam });
            }
           
        }
        if(findUser.userType == "user"){
            req.body.createdByUser = true;
        }
        await AppointmentController.createAppointment(req.body);
        return res.json({
            status: true,
            message: "Appointment Scheduled Successfully"
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

/******************* List User Appointments ***************************/
/*
    /api/appointment/listUserAppointments/status
*/
router.get('/listUserAppointments/:status', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var userCases = [];
        var findUser = await User.findOne({_id: ObjectID(checkAuth.userId)});
        userCases = await AppointmentController.listUserAppointment(checkAuth.userId, req.params.status,findUser.userType, findUser.ngoId._id);
    
        return res.json({
            status: true,
            message: "Data Found",
            data: await appointment.generateAppointmentResponse(userCases)
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});

/******************* List User Appointments Case No ***************************/
/*
    /api/appointment/listUserAppointmentsCaseNo/:caseNo
*/
router.get('/listUserAppointmentsCaseNo/:caseNo', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var userCases = [];
        var findUser = await User.findOne({_id: ObjectID(checkAuth.userId)});
        userCases = await AppointmentController.listUserAppointmentCaseNo(req.params.caseNo);
    
        return res.json({
            status: true,
            message: "Data Found",
            data: await appointment.generateAppointmentCaseNoResponse(userCases)
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* Cancel Single Appointment ***************************/
/*
    /api/appointment/cancelAppointment/:Id
*/
router.get('/cancelAppointment/:Id', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var findAppointment = await Appointment.findOne({_id: ObjectID(req.params.Id)});
       if(!findAppointment){
        return res.json({
            status: true,
            message: "Appointment Does not exist"
        })
       }

       if(findAppointment.appointmentStatus == "closed"){
        return res.json({
            status: true,
            message: "Appointment Already closed"
        })
       }

       if(findAppointment.appointmentStatus == "inprogress"){
        return res.json({
            status: true,
            message: "In Progress Appointment can not be closed"
        })
       }

       findAppointment.appointmentStatus = "cancelled";
 
       await AppointmentController.updateAppointment(req.params.Id,findAppointment);
        return res.json({
            status: true,
            message: "Appointment Cancelled"
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* List User Pending Documents ***************************/
/*
    /api/appointment/listUserPendingDocuments
*/
router.get('/listUserPendingDocuments', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var userCases = [];
        var findUser = await User.findOne({_id: ObjectID(checkAuth.userId)});
        userCases = await AppointmentController.listUserAppointment(checkAuth.userId, "closed",findUser.userType, findUser.ngoId._id);
    
        return res.json({
            status: true,
            message: "Data Found",
            data: await appointment.generatePendingDocumentsResponse(userCases)
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: error.message
        })
    }
});


module.exports = router;