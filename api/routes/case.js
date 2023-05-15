require("dotenv").config();
var express = require("express");
var router = express.Router();

var UserController = require("../controllers/user.js");
var CaseController = require("../controllers/case.js");
var AppointmentController = require("../controllers/appointment.js");

var Case = require("../models/case.js");
var User = require("../models/user.js");
var Appointment = require("../models/appointment.js");
var Schedule = require("../models/schedule.js");

/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
var reportsReponseHelper = require("../../helpers/case");
var caseHelper = require("../../helpers/caseNo");

var caseResponseHelper = require("../../helpers/case.js");

var authJwt = require("../../middlewares/authJwt");
const ObjectID = require('mongodb').ObjectId;
var pdf = require('html-pdf');

/******************* Create Case ***************************/
/*
    /api/case/create
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

        var findAppointment = await Appointment.findOne({ _id: req.body.appointmentId }).populate("scheduleId");

        var userType = findUser.userType;
        var findCreatedBy = await UserController.getUserById(findAppointment.createdBy);
        if(findCreatedBy){
            userType = findCreatedBy.userType;
        }

        var checkSchedule = await Schedule.findOne({ _id: findAppointment.scheduleId })
        if (!checkSchedule) {
            return res.json({
                status: false,
                message: "No Schedule Found for this user"
            })
        }
        if (!findAppointment) {
            return res.json({
                status: false,
                message: "No Appointment Found with this ID"
            })
        }
        if (findAppointment.appointmentStatus == "closed") {
            return res.json({
                status: false,
                message: "Appointment Already Closed"
            })
        }
        if(req.body.otherUser == true){
            var requiredParamsArray = ["otherUserName", "otherUserMobile", "otherUserId"]
            var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
            if (checkParams.status) {
                return res.json({ status: false, message: checkParams.missingParam });
            }
        }
        if(userType != "user"){
            req.body.caseName = findAppointment.caseName;
            req.body.caseNo = findAppointment.caseNo;
        }
        if(userType == "user"){
            req.body.branchId = findAppointment.scheduleId.branchId;
            req.body.ngoId = findAppointment.scheduleId.ngoId;
            req.body.projectId = req.body.projectId;
        } else {
            req.body.branchId = findAppointment.scheduleId.branchId;
            req.body.ngoId = findAppointment.scheduleId.ngoId;
            req.body.projectId = findAppointment.projectId;
        }
      
        

        if (req.body.previousCaseLinked == true) {
            var findPreviousCase = await Appointment.findOne({ _id: req.body.previousCaseLinkedId });
            if (!findPreviousCase) {
                return res.json({
                    status: false,
                    message: "No previous case found Against this ID"
                })
            }
            var requiredParamsArray = ["previousCaseLinkedId", "caseLinkedUser", "appointmentId", "projectId"]
            var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
            if (checkParams.status) {
                return res.json({ status: false, message: checkParams.missingParam });
            }
            if(userType == "user"){
                req.body.caseName = findPreviousCase.caseName;
                req.body.caseNo = findPreviousCase.caseNo;
                req.body.projectId = findPreviousCase.projectId;
                findAppointment.caseName = findPreviousCase.caseName;
                findAppointment.caseNo = findPreviousCase.caseNo;
                findAppointment.projectId = findPreviousCase.projectId;
            } else {
                req.body.caseName = findPreviousCase.caseName;
                req.body.caseNo = findPreviousCase.caseNo;
                req.body.projectId = findPreviousCase.projectId;
                findAppointment.caseName = findPreviousCase.caseName;
                findAppointment.caseNo = findPreviousCase.caseNo;
                findAppointment.projectId = findPreviousCase.projectId;
            }
        } else {
            var requiredParamsArray = ["appointmentId", "caseLinkedUser","projectId"]
            var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
            if (checkParams.status) {
                return res.json({ status: false, message: checkParams.missingParam });
            }
            if(userType == "user"){
                req.body.caseName = req.body.caseName;
                req.body.caseNo = caseHelper.generateCaseNo(6);
                findAppointment.caseName = req.body.caseName;
                findAppointment.caseNo = req.body.caseNo;
                findAppointment.projectId = req.body.projectId;
            } else {
                req.body.caseNo = findAppointment.caseNo;
            }
        }
        findAppointment.appointmentStatus = "inprogress";
        findAppointment.createdBy = checkAuth.userId;
        await AppointmentController.updateAppointment(findAppointment._id, findAppointment)
        var c = await CaseController.createCase(req.body);
        var response = {
            caseId: c._id,
            caseNo: c.caseNo
        }
        return res.json({
            status: true,
            message: "Case Started Successfully",
            data: response
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

/******************* Create Case Reports ***************************/
/*
    /api/case/caseReports
*/
router.post("/caseReports", async (req, res) => {
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
        var requiredParamsArray = ["caseId"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        if (req.body.reportFiles == undefined) {
            return res.json({ status: false, message: "Upload Report Files" });
        }
        var findCase = await Case.findOne({ _id: req.body.caseId });
        if (!findCase) {
            return res.json({ status: false, message: "Case not found" });
        }

        if (findCase.caseReports && findCase.caseReports.length > 0) {
            req.body.reportFiles.forEach(el => {
                findCase.caseReports.push(el);
            })

        } else {
            findCase.caseReports = [];
            req.body.reportFiles.forEach(el => {
                findCase.caseReports.push(el);
            })
        }
        var findAppointment = await Appointment.findOne({ _id: findCase.appointmentId });
        findAppointment.appointmentStatus = "closed";
        findCase.caseStatus = "closed";
        await CaseController.updateCase(req.body.caseId, findCase);
        await AppointmentController.updateAppointment(findCase.appointmentId, findAppointment);
        return res.json({
            status: true,
            message: "Case Files Uploaded Successfully",
            data: findCase
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


/******************* Create Case Other Documents ***************************/
/*
    /api/case/otherDocuments
*/
router.post("/otherDocuments", async (req, res) => {
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
        var requiredParamsArray = ["caseId"];
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        if (req.body.otherDocuments == undefined) {
            return res.json({ status: false, message: "Upload Other Documents" });
        }
        var findCase = await Case.findOne({ _id: req.body.caseId });
        if (!findCase) {
            return res.json({ status: false, message: "Case not found" });
        }
        findCase.otherDocuments = [];
        req.body.otherDocuments.forEach(el => {
            findCase.otherDocuments.push(el);
        })
        findCase.attachedDocuments = [];
        if (req.body.attachedDocument != undefined) {
            req.body.attachedDocument.forEach(el => {
                var e = {
                    createdBy: checkAuth.userId,
                    attachedDocument: el
                };
                findCase.attachedDocuments.push(e)
            })
        }

        await CaseController.updateCase(req.body.caseId, findCase);
        return res.json({
            status: true,
            message: "Other Documents Uploaded Successfully",
            data: findCase
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



/******************* Case Refer to Export ***************************/
/*
    /api/case/referToExpert
*/
router.post("/referToExpert", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) {
            req.body.createdBy = checkAuth.userId;
            req.body.referedBy = checkAuth.userId;
        }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (!findUser) {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
        var requiredParamsArray = ["caseId", "referedTo", "referredComment", "scheduleId"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }
        var findCase = await Case.findOne({ _id: req.body.caseId });
        var findAppointment = await Appointment.findOne({ _id: findCase.appointmentId });
        if (!findCase) {
            return res.json({ status: false, message: "Case not found" });
        }
        var findSchedule = await Schedule.findOne({ _id: req.body.scheduleId });
        if (!findSchedule) {
            return res.json({ status: false, message: "Schedule not found" });
        }
        var appointment = new Appointment();
        appointment.caseName = findCase.caseName;
        appointment.caseNo = findCase.caseNo;
        appointment.previousAppointmentLinked = true;
        appointment.previousAppointmentLinkedId = findCase.appointmentId;
        appointment.appointmentUser = findCase.caseLinkedUser;
        appointment.appointmentWith = req.body.referedTo;
        appointment.scheduleId = req.body.scheduleId;
        appointment.projectId = findCase.projectId;
        appointment.referedCaseAppointmentDate = findSchedule.dateStart;
        appointment.referedCaseAppointmentTime = findSchedule.timeStartSlot;
        appointment.referedBy = checkAuth.userId;
        appointment.referredAppointmentLinkedId = findCase.appointmentId;
        appointment.referredComment = req.body.referredComment;
        appointment.createdBy =  checkAuth.userId;

        var app = await AppointmentController.createAppointment(appointment)

        var cs = new Case();
        cs.previousCaseLinked = findCase.previousCaseLinked;
        if (findCase.previousCaseLinked == true) {
            cs.previousCaseLinkedId = findCase.previousCaseLinkedId;
        }
        cs.projectId = findCase.projectId;
        cs.caseName = findCase.caseName;
        cs.caseLinkedUser = findCase.caseLinkedUser;
        cs.ngoId = findSchedule.ngoId;
        cs.branchId = findSchedule.branchId;
        cs.caseNo = findCase.caseNo;
        cs.caseReports = findCase.caseReports;
        cs.referedTo = req.body.referedTo;
        cs.referedCaseAppointmentDate = findSchedule.dateStart;
        cs.referedCaseAppointmentTime = findSchedule.timeStartSlot;
        cs.createdBy = checkAuth.userId;
        cs.referedBy = checkAuth.userId;
        cs.referredCaseLinkedId = findCase._id;
        cs.referredComment = req.body.referredComment;
        cs.caseStatus = 'processing'
        cs.appointmentId = app._id;

        // Old Case and Appointment Status Closed
        findCase.caseStatus = "closed";
        await CaseController.updateCase(req.body.caseId, findCase);

        findAppointment.appointmentStatus = "closed";
        await AppointmentController.updateAppointment(req.body.appointmentId, findAppointment);

        // New Appointment Create
        var c = await CaseController.createCase(cs);

        findCase.caseStatus = 'refered';
        findCase.referredCaseLinkedId = c._id;
        await CaseController.updateCase(req.body.caseId, findCase);

        return res.json({
            status: true,
            message: "Case Refered Successfully",
            data: cs
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


/******************* List User Previous Cases ***************************/
/*
    /api/case/listUserCases/:userId/:projectId
*/
router.get('/listUserCases/:userId/:projectId', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var userCases = [];
        userCases = await CaseController.listUserCases(req.params.userId,req.params.projectId);
        var finalResp = userCases.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.caseNo === value.caseNo
        ))
        )

        return res.json({
            status: true,
            message: "Data Found",
            data: finalResp
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List Case User Reports for a specific user selected in Step 1 ***************************/
/*
    /api/case/listCaseUserReports/:userId
*/
router.get('/listCaseUserReports/:userId', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var userCases = [];
        userCases = await CaseController.listCaseUserReports(req.params.userId);
        return res.json({
            status: true,
            message: "Data Found",
            data: await reportsReponseHelper.generateCaseReportsResponse(userCases)
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List User Previous Reports of who uploaded reports ***************************/
/*
    /api/case/listUserReports/:type/:userId
*/
router.get('/listUserReports/:type/:userId/:page/:size/:search?', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        let page = req.params.page;
        let size = req.params.size;
        let search = req.params.search;

        if (!page) page = 1;
        if (!size) size = 10;
        if (!search) search = "empty";

        const limit = parseInt(size);
        const skip = (page - 1) * size;

        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        var userCases = [];
        if (search == "empty") {
            var totalCases = await CaseController.listUserReports(req.params.userId, req.params.type, findUser.ngoId, 0, 0, findUser.userType);
            var total_documents = totalCases.length;

            
            userCases = await CaseController.listUserReports(req.params.userId, req.params.type, findUser.ngoId, limit, skip, findUser.userType);

            if (userCases.length > 0) {
      
                const previous_pages = page - 1;
                const next_pages = Math.ceil((total_documents - skip) / size);

                var reslt = {
                    status: true,
                    message: "Data Found",
                    data: await reportsReponseHelper.generateCaseGenerciResponse(userCases, req.params.type),
                    total: total_documents,
                    totalPages: Math.ceil(total_documents / size),
                    page: parseInt(page),
                    previous: previous_pages,
                    next: next_pages
                };
                return res.json({
                    status: true,
                    message: "Data Found",
                    data: reslt
                })
            } else {
                return res.json({
                    status: false,
                    message: "No Data Found",
                    data: userCases
                })
            }
        } else {
            return res.json({
                status: false,
                message: "No Data Found",
                data: userCases
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* List User Appointments ***************************/
/*
    /api/case/listUserCaseAppointments/:userId
*/
router.get('/listUserCaseAppointments/:userId/:page/:size', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        let page = req.params.page;
        let size = req.params.size;

        if (!page) page = 1;
        if (!size) size = 10;
        const limit = parseInt(size);
        const skip = (page - 1) * size;

        var totalAppointments = await CaseController.listUserCaseAppointments(req.params.userId, 0, 0);
        var total_documents = totalAppointments.length;

        var userCases = [];
        userCases = await CaseController.listUserCaseAppointments(req.params.userId, limit, skip);

        if (userCases.length > 0) {

            const previous_pages = page - 1;
            const next_pages = Math.ceil((total_documents - skip) / size);

            var reslt = {
                status: true,
                message: "Data Found",
                data: userCases,
                total: total_documents,
                totalPages: Math.ceil(total_documents / size),
                page: parseInt(page),
                previous: previous_pages,
                next: next_pages
            };
            return res.json({
                status: true,
                message: "Data Found",
                data: reslt
            })
        } else {
            return res.json({
                status: false,
                message: "No Data Found",
                data: userCases
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});



/******************* List Reports based on Case No ***************************/
/*
    /api/case/listReportsCaseNo/:caseNo
*/
router.get('/listReportsCaseNo/:caseNo', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        var userCases = [];
        userCases = await CaseController.listReportsCaseNo(req.params.caseNo);
        if (findUser.userType != "ngoadmin") {
            for (var i = 0; i <= userCases.length; i++) {
                if (userCases[i] != undefined) {
                    for (var b = 0; b < userCases[i].caseReports.length; b++) {
                        if (userCases[i].caseReports[b].reportType == "private" && userCases[i].caseReports[b].createdBy._id != checkAuth.userId) {
                            if (userCases[i].caseReports != undefined) {
                                userCases[i].caseReports.splice(b, 1)
                            }
                        }
                    }
                }
            }
        }
        return res.json({
            status: true,
            message: "Data Found",
            data: await reportsReponseHelper.generateSingleCaseReportsResponse(userCases)
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* List Reports based on Project Based ***************************/
/*
    /api/case/listReportsCaseNo/:projectId
*/
router.get('/listReportsProjectId/:projectId', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        var userCases = [];
        userCases = await CaseController.listReportsProject(req.params.projectId);
        if (findUser.userType != "ngoadmin") {
            for (var i = 0; i <= userCases.length; i++) {
                if (userCases[i] != undefined) {
                    for (var b = 0; b < userCases[i].caseReports.length; b++) {
                        if (userCases[i].caseReports[b].reportType == "private" && userCases[i].caseReports[b].createdBy._id != checkAuth.userId) {
                            if (userCases[i].caseReports != undefined) {
                                userCases[i].caseReports.splice(b, 1)
                            }
                        }
                    }
                }
            }
        }
        return res.json({
            status: true,
            message: "Data Found",
            data: await reportsReponseHelper.generateSingleCaseReportsResponse(userCases)
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List Reports based on Dates ***************************/
/*
    /api/case/listReportsCaseDateWise
*/
router.post('/listReportsCaseDateWise', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        var userCases = [];
        userCases = await CaseController.listReportsCaseDateWise(req.body.dateStart, req.body.dateEnd);
        if (findUser.userType != "ngoadmin") {
            for (var i = 0; i <= userCases.length; i++) {
                if (userCases[i] != undefined) {
                    for (var b = 0; b < userCases[i].caseReports.length; b++) {
                        if (userCases[i].caseReports[b].reportType == "private" && userCases[i].caseReports[b].createdBy._id != checkAuth.userId) {
                            if (userCases[i].caseReports != undefined) {
                                userCases[i].caseReports.splice(b, 1)
                            }
                        }
                    }
                }
            }
        }
        return res.json({
            status: true,
            message: "Data Found",
            data: await reportsReponseHelper.generateSingleCaseReportsResponse(userCases)
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List User Cases Project Based ***************************/
/*
    /api/case/listUserCasesProjectBased/:projectId
*/
router.get('/listUserCasesProjectBased/:projectId', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var userCases = [];
        userCases = await CaseController.listUserCasesProjectBased(req.params.projectId);
        var finalResp = userCases.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.caseNo === value.caseNo
        ))
        )

        return res.json({
            status: true,
            message: "Data Found",
            data: await caseResponseHelper.generateProjectCasesResponse(finalResp)
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* Close Case ***************************/
/*
    /api/case/close
*/
router.get("/close/:caseNo", async (req, res) => {
    try {
        authJwt.verifyToken(req);
        var findCase = await Case.findOne({caseNo: req.params.caseNo});
        var findAppointment = await Appointment.findOne({caseNo: req.params.caseNo});

        if(!findCase && !findAppointment){
            return res.json({
                status: false,
                message: "Case Not Found"
            })
        }
        if(!findCase && findAppointment){
            var findC = await Case.findOne({appointmentId: ObjectID(findAppointment._id)});
            if(findC) {
                await Case.updateMany(
                    { appointmentId: ObjectID(findAppointment._id) },
                    { $set: { "caseStatus" : "finished" } },
                    { upsert: true }
                );
            }
        }
       
        await Case.updateMany(
            { caseNo: req.params.caseNo },
            { $set: { "caseStatus" : "finished" } },
            { upsert: true }
        );
        await Appointment.updateMany(
            { caseNo: req.params.caseNo },
            { $set: { "appointmentStatus" : "finished" } },
            { upsert: true }
        );

        return res.json({
            status: true,
            message: "Case Closed",
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


/******************* Close Case ***************************/
/*
    /api/case/generateReport
*/
router.post("/generateReport", async (req, res) => {
    try {
            var finalData = {
                          title: req.body.title,
                          project: req.body.project,
                          case: req.body.case,
                          reportBy: req.body.reportBy,
                          reportDate: req.body.reportDate,
                          htmlData : req.body.htmlData
                        };

                      res.render('report.html',{data: finalData}, function(err, html){ 
                        if (err) {
                            return console.log(err);
                        } else {
                          var options = {
                            "timeout": 600000,
                            format: 'Letter', width:"12in", height:"17in"
                          };
                          pdf.create(html, options).toFile('./reports/' + "report_"+Math.round(+new Date()/1000)+"_"+finalData.case+'.pdf', function (err, data) {
                            if (err) {
                                return res.json({status: false, message: "Error creating Report. Try again later."})
                            }
                            
                            return res.json({status: true, data: "report_"+Math.round(+new Date()/1000)+"_"+finalData.case+'.pdf'});
                          });
                        }
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
            message: "Something Went Wrong"
        })
    }
});





module.exports = router;