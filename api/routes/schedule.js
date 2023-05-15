require("dotenv").config();
var express = require("express");
var jwt = require('jsonwebtoken');
var router = express.Router();

var ScheduleController = require("../controllers/schedule.js");
var NGOController = require("../controllers/ngo.js");
var User = require("../models/user.js");
var Schedule = require("../models/schedule");
var Appointment = require("../models/appointment");
/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
var schedular = require("../../helpers/schedular");


var authJwt = require("../../middlewares/authJwt");
const ObjectID = require('mongodb').ObjectId;


/******************* Create Schedule ***************************/
/*
    /api/schedule/create
*/
router.post("/create", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }

        var requiredParamsArray = ["ngoId", "branchId"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }

        var findNGO = await NGOController.getNGOById(req.body.ngoId);
        if (!findNGO) {
            return res.json({
                status: false,
                message: "NGO Not Found"
            })
        }
        if (findNGO.ngoBranches == undefined) {
            return res.json({
                status: false,
                message: "Please add branch in this NGO"
            })
        }

        let findBranch = findNGO.ngoBranches.find(o => o._id == req.body.branchId);
        if (!findBranch) {
            return res.json({
                status: false,
                message: "Branch not inside this NGO"
            })
        }
        if(!findBranch.branchStartTime){
            return res.json({
                status: false,
                message: "Please add Branch Start / EndTime"
            })
        }
        req.body.timeStartSlot = findBranch.branchStartTime;
        req.body.timeEndSlot = findBranch.branchEndTime;


        /* Check if entered date is greater than current date */
        var checkSchedule = await schedular.checkUserSchedule(req.body);
        if (checkSchedule.length > 0) {
            return res.json({
                status: true,
                message: checkSchedule
            })
        }
        if(req.body.users == undefined){
            return res.json({
                status: false,
                message: "Users array is empty"
            })
        }

        await ScheduleController.createSchedule(schedular.setInsertData(req.body));
        return res.json({
            status: true,
            message: "Schedule Created Successfully"
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


/******************* Cancel Schedule ***************************/
/*
    /api/schedule/cancel
*/
router.post("/cancel", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }

        var requiredParamsArray = ["userId", "leaveDate","branchId"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }

        var checkUserDates = await Schedule.find(
        {
            userId: ObjectID(req.body.userId),
            "dateStart": { $gte: new Date(req.body.leaveDate).toISOString() },
            "dateEnd": { $lte: new Date(req.body.leaveDate).toISOString() },
            "branchId": req.body.branchId
        })

      

        if (checkUserDates.length < 1) {
            return res.json({
                status: false,
                message: "No Schedule Found on this Date"
            })
        }
        await Schedule.updateMany(
            { userId: ObjectID(req.body.userId),
                "dateStart": { $gte: new Date(req.body.leaveDate).toISOString() },
                "dateEnd": { $lte: new Date(req.body.leaveDate).toISOString() },
                "branchId": req.body.branchId },
            { $set: { "scheduleStatus" : "leave" } },
            { upsert: true }
        );
            const promiseArr = [];
            return new Promise((resolve, reject) => {
                checkUserDates.forEach(element => {
                    promiseArr.push(
                        new Promise(async (resolvve, rejectt) => {
                            var a = await Appointment.updateOne({scheduleId: ObjectID(element._id)},{$set: {appointmentStatus : "cancelled"}})
                            resolvve(a);
                        })
                    )
                })
                return Promise.all(promiseArr).then(ress => {
                    return res.json({
                        status: true,
                        message: "Schedule / Appointment Cancelled",
                        data: checkUserDates
                    })
                })
            });

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

/******************* Cancel Schedule ***************************/
/*
    /api/schedule/cancel
*/
router.post("/slotCancel", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }

        var requiredParamsArray = ["scheduleId"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }

        var findSchedule = await Schedule.find(
        {
            _id: ObjectID(req.body.scheduleId)
        })
        if (findSchedule.length < 1) {
            return res.json({
                status: false,
                message: "No Schedule Found"
            })
        }
        await Schedule.findByIdAndUpdate(
            { _id: ObjectID(req.body.scheduleId)},
            { $set: { "scheduleStatus" : "leave" } },
            { upsert: true }
        );
        await Appointment.updateOne({scheduleId: ObjectID(req.body.scheduleId)},{$set: {appointmentStatus : "cancelled"}})
        return res.json({
            status: true,
            message: "Schedule / Appointment Cancelled"
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

/******************* List User Schedules ***************************/
/*
    /api/schedule/listSchedule
*/
router.post('/listSchedule', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var getSchedule = null;
        if(req.body.userId != undefined){
            checkAuth.userId = req.body.userId;
        }
        var findUser = await User.findOne({_id: checkAuth.userId});
        let userId = checkAuth.userId;
        if(req.body.userId != undefined){
            userId = req.body.userId;
        }
        if (req.body.date != undefined) {
            getSchedule = await ScheduleController.getScheduleByDate(userId,findUser.ngoId, req.body.date)
        } else {
            getSchedule = await ScheduleController.getScheduleByDate(userId,findUser.ngoId)
        }

        var resultSet = [];
        if (getSchedule.length > 0) {
            resultSet = await schedular.generateResponse(getSchedule)
        }

        return res.json({
            status: true,
            message: "Schedule Fetched Successfully",
            data: resultSet,
            dates: await schedular.getSignificantDates(resultSet)
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});

/******************* List All NGO User Schedules ***************************/
/*
    /api/schedule/listNGOUsersSchedule
*/
router.get('/listNGOUsersSchedule', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await User.findOne({_id: checkAuth.userId});
        if(!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        var getSchedule = [];
        var currentDate = new Date();
        getSchedule = await schedular.getNGOUsersAndSchedules(checkAuth.userId,findUser.ngoId, currentDate)

        return res.json({
            status: true,
            message: "NGO Schedule Fetched Successfully",
            data: getSchedule
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* List All NGO User Schedules - Part 2 ***************************/
/*
    /api/schedule/listNGOUsersSchedule_2
*/
router.post('/listNGOUsersSchedule_2', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await User.findOne({_id: ObjectID(checkAuth.userId)});
        if(!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        var getSchedule = [];
        if(req.body.slot != undefined){
            getSchedule = await schedular.getNGOUsersAndSchedules2(req.body.date,findUser.ngoId, req.body.type,req.body.slot)
        } else {
            getSchedule = await schedular.getNGOUsersAndSchedules2(req.body.date,findUser.ngoId, req.body.type,"")
        }
        

        return res.json({
            status: true,
            message: "NGO Schedule Fetched Successfully",
            data: getSchedule
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error
        })
    }
});




module.exports = router;