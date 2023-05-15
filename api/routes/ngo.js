require("dotenv").config();
var express = require("express");
var jwt = require('jsonwebtoken');
var router = express.Router();

var NGOController = require("../controllers/ngo.js");
var UserController = require("../controllers/user.js");
var DocumentController = require("../controllers/general_documents.js");
var User = require("../models/user.js");
var NGO = require("../models/ngo.js");
var Case = require("../models/case.js");
var Appointment = require("../models/appointment.js");
var Donation = require("../models/donation.js");
var Complaints = require("../models/complaints.js");

/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
var missingParams = require("../../helpers/missingParameters");
var Schedule = require("../../helpers/schedular");

var authJwt = require("../../middlewares/authJwt");
const ObjectID = require('mongodb').ObjectId;

/******************* Create NGO ***************************/
/*
    /api/ngo/create
*/
router.post("/create", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }
        var findNGO = await NGOController.getNGOById(checkAuth.userId);
        if (findNGO) {
            return res.json({
                status: false,
                message: "NGO Already Created"
            })
        }
        var ngo = await NGOController.createNGO(req.body);
        return res.json({
            status: true,
            message: "NGO Created Successfully",
            data: ngo
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


/******************* List All NGO ***************************/
/*
    /api/ngo/listAll
*/
router.get('/listAll', async function (req, res) {
    try {
        var ngoList = [];
        ngoList = await NGOController.getAllNGO();

        return res.json({
            status: true,
            message: "NGO Fetched Successfully",
            data: ngoList
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* List All NGO User ***************************/
/*
    /api/ngo/listNGOUsers/:type/:page/:size
*/
router.get('/listNGOUsers/:type/:page/:size/:status?/:search?', async function (req, res) {
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
        let status = req.params.status;
        let search = req.params.search;

        if (!status) status = "all";
        if (!search) search = "empty";

        if (!page) page = 1;
        if (!size) size = 10;
        const limit = parseInt(size);
        const skip = (page - 1) * size;

        var total_documents = 0;
        let findStatusBasedUsers;
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        var query = {
            userType: req.params.type,
            userStatus: { $ne: "deleted" }, ngoId: ObjectID(findUser.ngoId)
        };
        var findWithOutSearchDocuments = await User.find(query);

        if (findWithOutSearchDocuments) {
            total_documents = findWithOutSearchDocuments.length;
        }

        if (status != "all") {
            findStatusBasedUsers = findWithOutSearchDocuments.filter(o => o.verificationStatus == status);
            if (findStatusBasedUsers) { total_documents = findStatusBasedUsers.length; }
        }

        if (search != "empty") {
            if (status != "all") {
                var result = findStatusBasedUsers.filter(obj => obj.firstName == search ||
                    obj.lastName == search || obj.email == search);
                if (result) {
                    total_documents = result.length;
                }
            } else {
                var result = findWithOutSearchDocuments.filter(obj => obj.firstName == search ||
                    obj.lastName == search || obj.email == search);
                if (result) {
                    total_documents = result.length;
                }
            }
        }

        var ngoUsersList = [];
        var usersList;
        ngoUsersList = await UserController.getAllNgoUsers(findUser.ngoId, req.params.type, status, limit, skip);
        if (status != "all") {
            usersList = ngoUsersList.filter(o => o.verificationStatus == status);
            if (usersList) { ngoUsersList = []; ngoUsersList = usersList; }
        }
        if (search != "empty") {
            if (status != "all") {
                var result = ngoUsersList.filter(obj => obj.firstName.toLowerCase() == search.toLowerCase() ||
                    obj.lastName.toLowerCase() == search.toLowerCase() || obj.email.toLowerCase() == search.toLowerCase());
                if (result) {
                    ngoUsersList = []; ngoUsersList = result;
                }
            } else {
                var result = ngoUsersList.filter(obj => obj.firstName.toLowerCase() == search.toLowerCase() ||
                    obj.lastName.toLowerCase() == search.toLowerCase() || obj.email.toLowerCase() == search.toLowerCase());
                if (result) {
                    ngoUsersList = []; ngoUsersList = result;
                }
            }
        }
        var resp = [];
        ngoUsersList.forEach(async el => {
            var el = {
                "userStatus": el.userStatus,
                "verificationStatus": el.verificationStatus,
                "userType": el.userType,
                "_id": el._id,
                "firstName": el.firstName,
                "lastName": el.lastName,
                "email": el.email,
                "phoneNumber": el.phoneNumber,
                "profileImage": el.profileImage,
                "createdBy": el.createdBy,
                "ngoId": el.ngoId,
                "createdAt": el.createdAt,
                "userConsentForm": el.userConsentForm,
                "documents": await DocumentController.countDocuments(findUser.userType, findUser.ngoId, checkAuth.userId)
            };
            resp.push(el);
        })
        if (ngoUsersList.length > 0) {

            const previous_pages = page - 1;
            const next_pages = Math.ceil((total_documents - skip) / size);

            var reslt = {
                status: true,
                message: "Data Found",
                data: ngoUsersList,
                total: total_documents,
                totalPages: Math.ceil(total_documents / size),
                page: parseInt(page),
                previous: previous_pages,
                next: next_pages
            };
            return res.json(reslt)
        } else {
            return res.json({
                status: false,
                message: "No Data Found",
                data: ngoUsersList
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* List All NGO Scheduled User ***************************/
/*
    /api/ngo/listNGOAppointmentUsers/:type/:page/:size
*/
router.get('/listNGOAppointmentUsers/:type/:page/:size/:search?', async function (req, res) {
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

        if (!search) search = "empty";

        if (!page) page = 1;
        if (!size) size = 10;
        const limit = parseInt(size);
        const skip = (page - 1) * size;

        var total_documents = 0;
        let findStatusBasedUsers;
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        var query = {
            userType: req.params.type,
            userStatus: { $ne: "deleted" }, ngoId: ObjectID(findUser.ngoId)
        };
        var findWithOutSearchDocuments = await User.find(query);

        if (findWithOutSearchDocuments) {
            total_documents = findWithOutSearchDocuments.length;
        }

        findStatusBasedUsers = findWithOutSearchDocuments.filter(o => o.verificationStatus == "unverified" && o.appointmentId);
        if (findStatusBasedUsers) { total_documents = findStatusBasedUsers.length; }

        if (search != "empty") {
            var result = findStatusBasedUsers.filter(obj => obj.firstName == search ||
                obj.lastName == search || obj.email == search);
            if (result) {
                total_documents = result.length;
            }
        }

        var ngoUsersList = [];
        var usersList;
        ngoUsersList = await UserController.getAllNgoScheduledUsers(findUser.ngoId, req.params.type, limit, skip);
        usersList = ngoUsersList.filter(o => o.verificationStatus == "unverified" && o.appointmentId);
        if (usersList) { ngoUsersList = []; ngoUsersList = usersList; }
        
        if (search != "empty") {
            var result = ngoUsersList.filter(obj => obj.firstName.toLowerCase() == search.toLowerCase() ||
                obj.lastName.toLowerCase() == search.toLowerCase() || obj.email.toLowerCase() == search.toLowerCase());
            if (result) {
                ngoUsersList = []; ngoUsersList = result;
                }
        }

        if (ngoUsersList.length > 0) {

            const previous_pages = page - 1;
            const next_pages = Math.ceil((total_documents - skip) / size);

            var reslt = {
                status: true,
                message: "Data Found",
                data: await Schedule.generatUserScheduleResponse(ngoUsersList),
                total: total_documents,
                totalPages: Math.ceil(total_documents / size),
                page: parseInt(page),
                previous: previous_pages,
                next: next_pages
            };
            return res.json(reslt)
        } else {
            return res.json({
                status: false,
                message: "No Data Found",
                data: ngoUsersList
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List All NGO Verified User ***************************/
/*
    /api/ngo/listNGOVerifiedUsers
*/
router.get('/listNGOVerifiedUsers', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var ngoUsersList = [];
        ngoUsersList = await UserController.getAllNGOVerifiedUsers(checkAuth.userId);

        if (ngoUsersList.length > 0) {

            return res.json({
                status: true,
                message: "Data Found",
                data: ngoUsersList
            })
        } else {
            return res.json({
                status: false,
                message: "No Data Found",
                data: ngoUsersList
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List All NGO UnVerified User ***************************/
/*
    /api/ngo/listNGOUnVerifiedUsers
*/
router.get('/listNGOUnVerifiedUsers', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var ngoUsersList = [];
        ngoUsersList = await UserController.listNGOUnVerifiedUsers(checkAuth.userId);

        if (ngoUsersList.length > 0) {

            return res.json({
                status: true,
                message: "Data Found",
                data: ngoUsersList
            })
        } else {
            return res.json({
                status: false,
                message: "No Data Found",
                data: ngoUsersList
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* Verify NGO User ***************************/
/*
    /api/ngo/verify
*/
router.post("/verify", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!req.body.userId || req.body.userId == undefined) {
            return res.json({
                status: false,
                message: "User ID is required"
            })
        }
        var findUser = await UserController.getUserById(req.body.userId);
        if (findUser) {
            findUser.userConsentForm = {};
            if (req.body.consentForm) {
                if (req.body.consentForm.personalInformation) {
                    if(req.body.consentForm.personalInformation.firstName){
                        findUser.firstName = req.body.consentForm.personalInformation.firstName;
                    }
                    if(req.body.consentForm.personalInformation.lastName){
                        findUser.lastName = req.body.consentForm.personalInformation.lastName;
                    }
                    
                    findUser.userConsentForm.personalInformation = req.body.consentForm.personalInformation
                }
                if (req.body.consentForm.economicSituation) {
                    findUser.userConsentForm.economicSituation = req.body.consentForm.economicSituation
                }
                if (req.body.consentForm.healthAspects) {
                    findUser.userConsentForm.healthAspects = req.body.consentForm.healthAspects
                }
                if (req.body.consentForm.socioFamilySituation) {
                    findUser.userConsentForm.socioFamilySituation = req.body.consentForm.socioFamilySituation
                }
                if (req.body.consentForm.studiesTraining) {
                    findUser.userConsentForm.studiesTraining = req.body.consentForm.studiesTraining
                }
                if (req.body.consentForm.professionalReferences) {
                    findUser.userConsentForm.professionalReferences = req.body.consentForm.professionalReferences
                }
                if (req.body.consentForm.discriminationVoilence) {
                    findUser.userConsentForm.discriminationVoilence = req.body.consentForm.discriminationVoilence
                }
                if (req.body.consentForm.workExperience) {
                    findUser.userConsentForm.workExperience = req.body.consentForm.workExperience
                }
                findUser.userConsentForm.consentSignatures = req.body.consentForm.consentSignatures;
                findUser.userConsentForm.agreementSignatures = req.body.consentForm.agreementSignatures;
                findUser.verificationStatus = "verified";
                findUser.userConsentForm.approvedBy = checkAuth.userId;
                findUser.userConsentForm.userImage = req.body.consentForm.userImage;
            } else {
                return res.json({
                    status: false,
                    message: "Consent Form is required"
                })
            }

            var verifyUser = await UserController.verifyNGOUser(req.body.userId, findUser);
            if (verifyUser.nModified == 1) {
                return res.json({
                    status: true,
                    message: "User Verified Successfully",
                    data: findUser
                })
            } else {
                return res.json({
                    status: false,
                    message: "There is an error in updating entries. Try Again Later"
                })
            }
        } else {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
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

/******************* NGO Branches ***************************/

/******************* Create NGO Branch ***************************/
/*
    /api/ngo/createBranch
*/
router.post("/createBranch", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);

        var findNGO = await NGOController.getNGOByUser(checkAuth.userId);

        if (findNGO) {
            var requiredParamsArray = ["branchName", "branchLocation","branchPicture","branchContact","branchEmail","branchPointOfContact",
        "branchStartTime","branchEndTime"]
            var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
            if (checkParams.status) {
                return res.json({ status: false, message: checkParams.missingParam });
            }
            var ngoBranches = {
                "branchName": req.body.branchName,
                "branchLocation": req.body.branchLocation,
                "branchDescription": req.body.branchDescription ? req.body.branchDescription : "",
                "branchPicture": req.body.branchPicture ? req.body.branchPicture : "",
                "branchContact": req.body.branchContact ? req.body.branchContact : "",
                "branchEmail": req.body.branchEmail ? req.body.branchEmail : "",
                "branchStartTime": req.body.branchStartTime ? req.body.branchStartTime : "",
                "branchEndTime": req.body.branchEndTime ? req.body.branchEndTime : "",
                "branchPointOfContact": req.body.branchPointOfContact ? req.body.branchPointOfContact : "",
                "branchStatus": "active"
            };
            if (findNGO.ngoBranches) {
                findNGO.ngoBranches.push(ngoBranches);
            } else {
                findNGO.ngoBranches = [];
                findNGO.ngoBranches.push(ngoBranches);
            }

            await NGOController.updateNGO(findNGO._id, findNGO);
            return res.json({
                status: true,
                message: "NGO Branch Added Successfully",
                data: findNGO
            })

        } else {
            return res.json({
                status: false,
                message: "No NGO Found"
            })
        }

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

/******************* Edit NGO Branch ***************************/
/*
    /api/ngo/createBranch
*/
router.post("/editBranch", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);

        var findNGO = await NGOController.getNGOByUser(checkAuth.userId);

        if (findNGO) {
            var requiredParamsArray = ["branchId"]
            var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
            if (checkParams.status) {
                return res.json({ status: false, message: checkParams.missingParam });
            }
            let findBranch = findNGO.ngoBranches.find(o => o._id == req.body.branchId);
            if (!findBranch) {
                return res.json({
                    status: false,
                    message: "No Branch Found against this ID"
                })
            }
            var findBranchIndex = findNGO.ngoBranches.findIndex((obj => obj._id == req.body.branchId));
            if (req.body.branchName != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchName = req.body.branchName;
            }
            if (req.body.branchLocation != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchLocation = req.body.branchLocation;
            }
            if (req.body.branchDescription != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchDescription = req.body.branchDescription;
            }
            if (req.body.branchPicture != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchPicture = req.body.branchPicture;
            }
            if (req.body.branchContact != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchContact = req.body.branchContact;
            }
            if (req.body.branchEmail != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchEmail = req.body.branchEmail;
            }
            if (req.body.branchPointOfContact != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchPointOfContact = req.body.branchPointOfContact;
            }
            if (req.body.branchStatus != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchStatus = req.body.branchStatus;
            }
            if (req.body.branchStartTime != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchStartTime = req.body.branchStartTime;
            }
            if (req.body.branchEndTime != undefined) {
                findNGO.ngoBranches[findBranchIndex].branchEndTime = req.body.branchEndTime;
            }

            await NGOController.updateNGO(findNGO._id, findNGO);
            return res.json({
                status: true,
                message: "Branch Edited Successfully",
                data: findNGO
            })

        } else {
            return res.json({
                status: false,
                message: "No NGO Found"
            })
        }

    } catch (error) {
        console.log(error)
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


/******************* List All NGO Branches ***************************/
/*
    /api/ngo/listAllBranches
*/
router.get('/listAllBranches', async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }

        var ngoBranches = [];
        ngoBranches = await NGOController.listAllBranches(checkAuth.userId);
        let allBranches = ngoBranches[0].ngoBranches.filter(o => o.branchStatus != "deleted");
        if (ngoBranches.length > 0) {

            return res.json({
                status: true,
                message: "Data Found",
                data: allBranches
            })
        } else {
            return res.json({
                status: false,
                message: "No Data Found",
                data: ngoUsersList
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* NGO Statistics ***************************/
/*
    /api/ngo/statistics
*/

router.get("/statistics", async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const d = new Date();
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        const promiseArr = [];
        var resultSet = {
            allNgoUsers: 0,
            allAppointments: 0,
            allReports: 0,
            graphData: []
        };
        const promise1 = new Promise(async (resolve, reject) => {
            var getNGOUsers = await User.countDocuments({
                ngoId: ObjectID(findUser.ngoId), userStatus: { $ne: "deleted" },
                userType: "user"
            })
            resolve(getNGOUsers);
        });

        const promise2 = new Promise(async (resolve, reject) => {
            var allAppointments = await Appointment.countDocuments({ appointmentWith: ObjectID(checkAuth.userId), appointmentType: "appointment", });
            resolve(allAppointments);
        });
        const promise3 = new Promise(async (resolve, reject) => {
            var allReportsPrivate = await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(findUser.ngoId),
                'caseReports': {
                    $elemMatch: {
                        createdBy: ObjectID(checkAuth.userId),
                        reportType: "private"
                    }
                }
            })
            var allReportsPublic = await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(findUser.ngoId),
                'caseReports': {
                    $elemMatch: {
                        reportType: "public"
                    }
                }
            })
            resolve(allReportsPrivate.length + allReportsPublic.length)
        });
        const promise4 = new Promise(async (resolve, reject) => {
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            var monthlyAppointments = await Appointment.aggregate([
                {
                    $match: {
                        appointmentWith: ObjectID(checkAuth.userId),
                        appointmentType: "appointment",
                        $expr: {
                            $and: [
                                {
                                    $gte: [
                                        "$createdDate",
                                        new Date(firstDay)
                                    ]
                                },
                                {
                                    $lte: [
                                        "$createdDate",
                                        new Date(lastDay)
                                    ]
                                },
                            ],
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            day: { $dayOfMonth: "$createdDate" }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ])
            resolve(monthlyAppointments)
        });
        return Promise.all([
            promise1,
            promise2,
            promise3,
            promise4
        ]).then((finalRes) => {
            resultSet.allNgoUsers = finalRes[0];
            resultSet.allAppointments = finalRes[1];
            resultSet.allReports = finalRes[2];
            resultSet.graphData = [];
            resultSet.graphData = finalRes[3];
            res.send({ status: true, data: resultSet, currentMonth: monthNames[d.getMonth()] });
        });
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
})


/******************* Admin NGO Statistics ***************************/
/*
    /api/ngo/admin-ngo-statistics
*/

router.get("/admin-ngo-statistics", async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const d = new Date();
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        const promiseArr = [];
        var resultSet = {
            totalBranches: 0,
            totalProfessionals: 0,
            totalUsers: 0,
            totalCases: 0,
            totalAppointments: 0,
            totalReports: 0,
            totalComplaints: 0,
            totalDonations: 0,
            graphData: []
        };
        const promise1 = new Promise(async (resolve, reject) => {
            var findNGO = await NGO.findOne({ _id: findUser.ngoId });
            let allBranches = findNGO.ngoBranches.filter(o => o.branchStatus != "deleted");
            resolve(allBranches.length);
        });
        const promise2 = new Promise(async (resolve, reject) => {
            var getProfessionals = await User.countDocuments({
                ngoId: ObjectID(findUser.ngoId), userType: { $in: ["socialWorker", "psychologist", "lawyer"] },
                userStatus: "active"
            })
            resolve(getProfessionals);
        });

        const promise3 = new Promise(async (resolve, reject) => {
            var getUsers = await User.countDocuments({
                ngoId: ObjectID(findUser.ngoId), userType: "user",
                userStatus: "active"
            })
            resolve(getUsers);
        });
        const promise4 = new Promise(async (resolve, reject) => {
            var totalCases = await Case.countDocuments({
                ngoId: ObjectID(findUser.ngoId), caseStatus: "closed"
            })
            resolve(totalCases);
        });
        const promise5 = new Promise(async (resolve, reject) => {
            var totalAppointments = await Appointment.countDocuments({
                ngoId: ObjectID(findUser.ngoId), appointmentStatus: "closed",
                appointmentType: "appointment",
            })
            resolve(totalAppointments);
        });
        const promise6 = new Promise(async (resolve, reject) => {
            var allReportsPrivate = await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(findUser.ngoId),
                'caseReports': {
                    $elemMatch: {
                        createdBy: ObjectID(checkAuth.userId),
                        reportType: "private"
                    }
                }
            })
            var allReportsPublic = await Case.find({
                caseStatus: { $in: ["closed", "processing"] },
                ngoId: ObjectID(findUser.ngoId),
                'caseReports': {
                    $elemMatch: {
                        reportType: "public"
                    }
                }
            })
            resolve(allReportsPrivate.length + allReportsPublic.length)
        });
        const promise7 = new Promise(async (resolve, reject) => {
            var totalComplaints = await Complaints.countDocuments({
                ngoId: ObjectID(findUser.ngoId)
            })
            resolve(totalComplaints);
        });
        const promise8 = new Promise(async (resolve, reject) => {
            var totalDonations = await Donation.find({ ngoId: findUser.ngoId });
            var sum = 0;
            totalDonations.forEach(el => {
                sum += parseInt(el.amount);
            })
            resolve(sum);
        });

        const promise9 = new Promise(async (resolve, reject) => {
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            var monthlyAppointments = await Appointment.aggregate([
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $gte: [
                                        "$createdDate",
                                        new Date(firstDay)
                                    ]
                                },
                                {
                                    $lte: [
                                        "$createdDate",
                                        new Date(lastDay)
                                    ]
                                },
                            ],
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            day: { $dayOfMonth: "$createdDate" }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ])
            resolve(monthlyAppointments)
        });
        return Promise.all([
            promise1,
            promise2,
            promise3,
            promise4,
            promise5,
            promise6,
            promise7,
            promise8,
            promise9
        ]).then((finalRes) => {
            resultSet.totalBranches = finalRes[0];
            resultSet.totalProfessionals = finalRes[1];
            resultSet.totalUsers = finalRes[2];
            resultSet.totalCases = finalRes[3];
            resultSet.totalAppointments = finalRes[4];
            resultSet.totalReports = finalRes[5];
            resultSet.totalComplaints = finalRes[6];
            resultSet.totalDonations = finalRes[7];
            resultSet.graphData = finalRes[8];
            res.send({ status: true, data: resultSet, currentMonth: monthNames[d.getMonth()] });
        });
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
})


/******************* User Statistics ***************************/
/*
    /api/ngo/user-statistics
*/

router.get("/user-statistics", async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const d = new Date();
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })
        const promiseArr = [];
        var resultSet = {
            allDonations: 0,
            allAppointments: 0,
            allComplaints: 0,
            graphData: []
        };
        const promise1 = new Promise(async (resolve, reject) => {
            var totalComplaints = await Complaints.countDocuments({
                createdBy: ObjectID(checkAuth.userId)
            })
            resolve(totalComplaints);
        });
        const promise2 = new Promise(async (resolve, reject) => {
            var totalDonations = await Donation.find({ userId: checkAuth.userId });
            var sum = 0;
            totalDonations.forEach(el => {
                sum += parseInt(el.amount);
            })
            resolve(sum);
        });

        const promise3 = new Promise(async (resolve, reject) => {
            var allAppointments = await Appointment.countDocuments({ appointmentUser: ObjectID(checkAuth.userId),
                appointmentType: "appointment" });
            resolve(allAppointments);
        });
        const promise4 = new Promise(async (resolve, reject) => {
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            var monthlyAppointments = await Appointment.aggregate([
                {
                    $match: {
                        appointmentUser: ObjectID(checkAuth.userId),
                        appointmentType: "appointment",
                        $expr: {
                            $and: [
                                {
                                    $gte: [
                                        "$createdDate",
                                        new Date(firstDay)
                                    ]
                                },
                                {
                                    $lte: [
                                        "$createdDate",
                                        new Date(lastDay)
                                    ]
                                },
                            ],
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            day: { $dayOfMonth: "$createdDate" }
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ])
            resolve(monthlyAppointments)
        });
        return Promise.all([
            promise1,
            promise2,
            promise3,
            promise4
        ]).then((finalRes) => {
            resultSet.allComplaints = finalRes[0];
            resultSet.allDonations = finalRes[1];
            resultSet.allAppointments = finalRes[2];
            resultSet.graphData = [];
            resultSet.graphData = finalRes[3];
            res.send({ status: true, data: resultSet, currentMonth: monthNames[d.getMonth()] });
        });
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
})

module.exports = router;