require("dotenv").config();
var express = require("express");
var jwt = require('jsonwebtoken');
var router = express.Router();
const bcrypt = require('bcrypt-nodejs');

var UserController = require("../controllers/user.js");
var AppointmentController = require("../controllers/appointment.js");
var DocumentController = require("../controllers/general_documents.js");
var User = require("../models/user.js");
var Schedule = require("../models/schedule.js");
var NGO = require("../models/ngo.js");
var Appointment = require("../models/appointment.js");
const record = new User();

/* Helpers, middlewares and config */
var errorMessages = require("../../helpers/errorMessages");
const fileUpload = require("../../config/fileUpload");

var authJwt = require("../../middlewares/authJwt");
var missingParams = require("../../helpers/missingParameters");
var config = require("../../config/auth.config");
var sendEmail = require("../../helpers/sendEmail.js");
const { ObjectID } = require("mongodb");


/******************* Create User ***************************/
/*
    /api/user/create
*/
router.post("/create", async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (checkAuth) { req.body.createdBy = checkAuth.userId; }
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) })

        req.body.ngoId = findUser.ngoId;
        if (req.body.userType == "user") {
            req.body.verificationStatus = "unverified";
        }
        var user = await UserController.createUser(req.body);
        return res.json({
            status: true,
            message: "User Created Successfully",
            data: user
        })
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

/******************* Create User Normal ***************************/
/*
    /api/user/signup
*/
router.post("/signup", async (req, res) => {
    try {
        var findUser = await User.findOne({ ngoId: ObjectID(req.body.ngoId), email: req.body.email });
        if (findUser) {
            return res.json({
                status: false,
                message: "User Already found in this NGO with same Email"
            })
        }
        if (req.body.userType != "user") {
            req.body.verificationStatus = "verified";
            req.body.userStatus = "inactive";
        } else {
            req.body.verificationStatus = "unverified";
        }

        var user = await UserController.createUser(req.body);
        return res.json({
            status: true,
            message: "User Created Successfully",
            data: user
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


/******************* Edit User ***************************/
/*
    /api/user/edit
*/
router.post("/edit", async (req, res) => {
    try {
        authJwt.verifyToken(req);
        var findUser = await UserController.getUserById(req.body.userId);
        if (findUser) {
            if (req.body.firstName) { findUser.firstName = req.body.firstName; }
            if (req.body.lastName) { findUser.lastName = req.body.lastName; }
            if (req.body.phoneNumber) { findUser.phoneNumber = req.body.phoneNumber; }
            if (req.body.IDDetails) { findUser.IDDetails = req.body.IDDetails; }
            if (req.body.profileImage) { findUser.profileImage = req.body.profileImage; }

        } else {
            return res.json({
                status: false,
                message: "No User Found"
            })
        }
        await UserController.updateUser(req.body.userId, findUser);
        return res.json({
            status: true,
            message: "User Updated Successfully",
            data: findUser
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

/******************* Login User ***************************/
/*
    /api/user/signin
*/
router.post("/signin", async (req, res) => {
    try {

        var requiredParamsArray = ["email", "password"]
        var checkParams = await missingParams.missingParams(req.body, requiredParamsArray);
        if (checkParams.status) {
            return res.json({ status: false, message: checkParams.missingParam });
        }

        var user = await UserController.findUserByEmail(req.body.email);
        if (!user) {
            return res.json({ status: false, message: "User Not Found with this Email" });
        }
        if (!record.comparePassword(req.body.password, user.password)) {
            return res.json({ status: false, message: "Authentication Failed with this Password" });
        }
        let appointmentDate = '';
        let appointmentTime = '';
        var professionalName = '';
        var ngoName = '';
        var branchName = '';
        let appointmentBooked = false;
        let appointmentId='';
        let appointmentStatus = '';
        if (user.verificationStatus == "unverified") {
            var findAppointment = await Appointment.findOne({ appointmentUser: ObjectID(user._id), appointmentType: 'verification' , appointmentStatus: "scheduled"})
                .populate("scheduleId");
            if (findAppointment) {
                appointmentStatus = findAppointment.appointmentStatus;
                appointmentBooked = true;
                appointmentId = findAppointment._id;
                if(findAppointment){
                    appointmentDate = findAppointment.scheduleId.dateStart;
                    appointmentTime = findAppointment.scheduleId.timeStartSlot + '-' + findAppointment.scheduleId.timeEndSlot;
                }
              
            }
            if (findAppointment) {
                var getNGO = await NGO.findOne({_id: ObjectID(findAppointment.scheduleId.ngoId)});
                ngoName = getNGO.ngoName;
                if(getNGO){
                    var branches = getNGO.ngoBranches.filter(o => o._id == findAppointment.scheduleId.branchId);
                    
                    if(branches.length > 0){
                        branchName= branches[0].branchName
                    }
                }
                var getUser = await User.findOne({_id: ObjectID(findAppointment.appointmentWith)});
                professionalName = getUser.firstName + " " + getUser.lastName;
            }
        }
        if (user.userStatus == "deleted") {
            return res.json({ status: false, message: "User Not Found" });
        }
        if (user.userStatus == "inactive") {
            return res.json({ status: false, message: "Account Not Active / Deactivated" });
        }
        return res.json({
            status: true,
            message: "User Logged in Successfully",
            name: user.firstName + " " + user.lastName,
            userType: user.userType,
            userId: user._id,
            email: user.email,
            profileImage: user.profileImage ? user.profileImage : "",
            phoneNumber: user.phoneNumber ? user.phoneNumber : "",
            token: jwt.sign({ id: user._id, userType: user.userType }, config.secret, { expiresIn: 86400 }),
            appointmentBooked: appointmentBooked,
            verificationStatus: user.verificationStatus,
            appointmentTime: appointmentTime,
            appointmentDate: appointmentDate,
            professionalName: professionalName,
            ngoName: ngoName,
            branchName: branchName,
            appointmentId: appointmentId,
            appointmentStatus
        })
    } catch (error) {
        return res.json({
            status: false,
            message: error
        })
    }
});

/******************* List Users ***************************/
/*
    /api/user/listUsers/type
*/
router.get('/listUsers/:type/:page/:size/:search?', async (req, res) => {
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
        var usersList = [];
        var total_documents = 0;
        if (search == "empty") {
            var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) });
            if (findUser.userType == "ngoadmin") {
                var query = {
                    userType: { $nin: ["user", "ngoadmin"] },
                    userStatus: { $ne: "deleted" }, ngoId: ObjectID(findUser.ngoId)
                };
                var findWithOutSearchDocuments = await User.find(query);

                if (findWithOutSearchDocuments) {
                    total_documents = findWithOutSearchDocuments.length;
                }
            }
            usersList = await UserController.getAllNgoUsersWithOutStatus(findUser.ngoId, checkAuth.userId, req.params.type, limit, skip);
        }

        if (search != "empty") {
            var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) });
            if (findUser.userType == "ngoadmin") {
                var query = {
                    userType: { $nin: ["user", "ngoadmin"] },
                    userStatus: { $ne: "deleted" }, ngoId: ObjectID(findUser.ngoId)
                };
                var findWithOutSearchDocuments = await User.find(query);
                var filterDocs = findWithOutSearchDocuments.filter(obj => obj.firstName.toLowerCase() == search.toLowerCase() ||
                    obj.lastName.toLowerCase() == search.toLowerCase() || obj.email.toLowerCase() == search.toLowerCase());
                if (filterDocs) {
                    total_documents = filterDocs.length;
                }
            }
            usersList = await UserController.getAllNgoUsersWithOutStatus(findUser.ngoId, checkAuth.userId, req.params.type, limit, skip);
            var filterDocs = usersList.filter(obj => obj.firstName.toLowerCase() == search.toLowerCase() ||
                obj.lastName.toLowerCase() == search.toLowerCase() || obj.email.toLowerCase() == search.toLowerCase());
            if (filterDocs) {
                usersList = [];
                usersList = filterDocs;
            }
        }

        const previous_pages = page - 1;
        const next_pages = Math.ceil((total_documents - skip) / size);

        var reslt = {
            status: true,
            message: "Data Found",
            data: usersList,
            total: total_documents,
            totalPages: Math.ceil(total_documents / size),
            page: parseInt(page),
            previous: previous_pages,
            next: next_pages
        };
        return res.json(reslt)

    } catch (error) {
        return res.json({
            status: false,
            message: error
        })
    }
});

/******************* List Single User ***************************/
/*
    /api/user/listSingleUser/:userId
*/
router.get('/listSingleUser/:userId', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await UserController.getUserById(checkAuth.userId);
        var user = await UserController.getUserById(req.params.userId);
        var docs = await DocumentController.listSpecificUserDocuments(req.params.userId)
        return res.json({
            status: true,
            message: "User Fetched Successfully",
            data: user,
            documents: docs
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});


/******************* List Scheduled Verification ***************************/
/*
    /api/user/verificationScheduledUsers
*/
router.get('/verificationScheduledUsers/:type', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await UserController.getUserById(checkAuth.userId);

        var getUsers = await User.find({verificationStatus : 'unverified', ngoId: ObjectID(findUser.ngoId._id)});
        var filteredUsers;
        if(req.params.type == "appointment"){
            filteredUsers = getUsers.filter(o => o.appointmentId);
        } else {
            filteredUsers = getUsers.filter(o => !(o.appointmentId));
        }
       
        return res.json({
            status: true,
            message: "User Fetched Successfully",
            data: filteredUsers
        })
    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* Change User Status ***************************/
/*
    /api/user/changeStatus

*/
router.post('/changeStatus', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await UserController.getUserById(req.body.userId);
        if (findUser) {
            findUser.userStatus = req.body.userStatus;
            await UserController.updateUser(req.body.userId, findUser);

            return res.json({
                status: true,
                message: "Record Updated Successfully"
            })
        } else {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }

    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* Update Profile ***************************/
/*
    /api/user/updateProfile

*/
router.post('/updateProfile', fileUpload.fields([
    {
        name: "profileImage",
        maxCount: 1,
    },
]), async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findUser = await UserController.getUserById(checkAuth.userId);
        if (findUser) {
            if (Object.keys(req.files).length > 0) {
                findUser.profileImage = req.files.profileImage[0].location;
            }
            if (req.body.firstName != undefined) {
                findUser.firstName = req.body.firstName;
            }
            if (req.body.lastName != undefined) {
                findUser.lastName = req.body.lastName;
            }
            if (req.body.phoneNumber != undefined) {
                findUser.phoneNumber = req.body.phoneNumber;
            }

            await UserController.updateUser(checkAuth.userId, findUser);

            return res.json({
                status: true,
                message: "Profile Updated Successfully",
                data: {
                    profileImage: findUser.profileImage,
                    firstName: findUser.firstName,
                    lastName: findUser.lastName,
                    phoneNumber: findUser.phoneNumber
                }
            })
        } else {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }

    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* Change Password  ***************************/
/*
    /api/user/changePassword

*/
router.post("/changePassword", async function (req, res) {
    try {
        var checkAuth = authJwt.verifyToken(req);
        var findUser = await User.findOne({ _id: ObjectID(checkAuth.userId) });
        if (findUser) {
            if (record.comparePassword(req.body.oldPassword, findUser.password)) {
                findUser.password = record.hashPassword(req.body.password);
                await UserController.updateUser(checkAuth.userId, findUser);
                return res.json({
                    message: "Password Updated Successfully",
                    status: true
                });
            } else {
                return res.json({
                    message: "Old Password does not match",
                    status: false,
                });
            }
        } else {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});

/******************* Under 18 form ***************************/
/*
    /api/user/under18
*/
router.post("/under18", async (req, res) => {
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
            findUser.under18Form = {};
            if (req.body.under18Form) {
                findUser.under18Form = req.body.under18Form
                
                findUser.under18Form.addedByUser = checkAuth.userId;
                var verifyUser = await UserController.setUnderAndOver18User(req.body.userId, findUser);
                if (verifyUser.nModified == 1) {
                    return res.json({
                        status: true,
                        message: "User Under 18 Form Submitted Successfully",
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
                    message: "Under 18 Form is required"
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


/******************* Above 18 form ***************************/
/*
    /api/user/over18
*/
router.post("/over18", async (req, res) => {
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
            findUser.over18Form = {};
            if (req.body.over18Form) {
                findUser.over18Form = req.body.over18Form
                findUser.over18Form.addedByUser = checkAuth.userId;
                var verifyUser = await UserController.setUnderAndOver18User(req.body.userId, findUser);
                if (verifyUser.nModified == 1) {
                    return res.json({
                        status: true,
                        message: "User Under 18 Form Submitted Successfully",
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
                    message: "Under 18 Form is required"
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

/******************* Schedule Verification Appointment ***************************/
/*
    /api/user/scheduleVerification

*/
router.post('/scheduleVerification', async (req, res) => {
    try {
        var checkAuth = authJwt.verifyToken(req);
        if (!checkAuth) {
            return res.json({
                status: false,
                message: "Authentication Failed"
            })
        }
        var findAppointment = await Appointment.findOne({ appointmentUser: ObjectID(req.body.appointmentUser), appointmentType: 'verification' });
       
        if (findAppointment) {
            if(findAppointment.appointmentStatus == "scheduled" || findAppointment.appointmentStatus == "inprogress")
            return res.json({
                status: false,
                message: "Verification Appointment Already Booked"
            })
        }
        var getSchedule = await Schedule.findOne({ _id: req.body.scheduleId });
        var app = await AppointmentController.createAppointment(req.body);
        var getUser = await User.findOne({ _id: ObjectID(req.body.appointmentUser) });
        var appointmentWith = await User.findOne({ _id: ObjectID(req.body.appointmentWith) });
        var getNGO = await NGO.findOne({_id: ObjectID(getSchedule.ngoId)});
        var branches = getNGO.ngoBranches.filter(o => o._id == getSchedule.branchId);
        var branchName = '';
        if(branches.length > 0){
            branchName= branches[0].branchName
        }
        getUser.appointmentId = app._id;
        await UserController.updateUser(req.body.appointmentUser, getUser);
        return res.json({
            status: true,
            message: "Verification Appointment Scheduled Successfully",
            data: getSchedule.dateStart + " " + getSchedule.timeStartSlot + "-" + getSchedule.timeEndSlot,
            ngoName: getNGO.ngoName,
            professionalName: appointmentWith.firstName +  ' ' + appointmentWith.lastName,
            branchName: branchName

        })

    } catch (error) {
        return res.json({
            status: false,
            message: "Something Went Wrong"
        })
    }
});

/******************* Password Reset Email  ***************************/
/*
    /api/user/sendUserPasswordResetEmail

*/
router.post("/sendUserPasswordResetEmail", async function (req, res) {
    try {
        const { email } = req.body;

        var findUser = await User.findOne({ email });
        if (findUser) {
            // const secret = findUser._id + process.env.JWT_SECRET_KEY;

            // const token = await authJwt.webStasignToken(
            //     findUser._id,
            //     secret,
            //     process.env.JWT_PSSWORD_RESET_TOKEN_EXPIRE
            //   );
            //  const link = `${process.env.VERIFY_RESET_EMAIL_BASE_URL}/${findUser._id}/${token}`;
            let OTP = await missingParams.randomString(8, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            findUser.OTP = OTP;
            await User.updateOne(
                {
                    "_id": ObjectID(findUser._id)
                },
                { "$set": findUser });
            await sendEmail.sendPasswordResetEmail(findUser.email, { findUser, OTP }, res)
            return res.json({
                status: true,
                message: "OTP Sent on Email"
            })
        } else {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* Password Reset Email  ***************************/
/*
    /api/user/userPasswordReset

*/
router.post("/userPasswordReset", async function (req, res) {
    try {
        const { password, password_confirmation, OTP } = req.body;
        const user = await User.findOne({OTP: OTP});
      
        if (user) {
            if (password && password_confirmation) {
                if (password !== password_confirmation) {
                    return res.json({
                        status: false,
                        message: "Password and Confirm Password does not match"
                    })
                }
                const newHashPassword = record.hashPassword(password);
                await User.findByIdAndUpdate(user._id, {
                    $set: { password: newHashPassword, OTP: "" },
                });

                return res.json({
                    status: true,
                    message: "Password Reset Successfully"
                })
            }

        } else {
            return res.json({
                status: false,
                message: "User Not Found"
            })
        }
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            message: error.message
        })
    }
});


/******************* Password Reset Email  ***************************/
/*
    /api/user/userPasswordReset

*/
router.post("/verifyOTP", async function (req, res) {
    try {
        const { OTP, type } = req.body;
        const user = await User.findOne({ OTP: OTP });

        if (user) {
            if(type == "email"){
                await User.findByIdAndUpdate(user._id, {
                    $set: { emailVerified: true },
                });
            }
            return res.json({
                status: true,
                message: "OTP Verified"
            })

        } else {
            return res.json({
                status: false,
                message: "Invalid OTP"
            })
        }
    } catch (error) {
        return res.json({
            status: false,
            message: error.message
        })
    }
});


module.exports = router;

