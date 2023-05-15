/* User Model */
var User = require("../models/user.js");
const record = new User();
const ObjectID = require('mongodb').ObjectId;

exports.getAllUsers = async () => {
    return await User.find({ userType: "ngoadmin" }, { password: 0 });
};
exports.getAllNgoUsers = async (Id, userType, status, limit, skip) => {
    if (status == "all") {
        return await User.find({ ngoId: ObjectID(Id), userType: "user", userStatus: {$ne : "deleted"} }, { password: 0 })
            .limit(limit)
            .skip(skip)
    } else {
        return await User.find({ ngoId: ObjectID(Id), userType: userType, userStatus: {$ne : "deleted"}, verificationStatus: status }, { password: 0 })
            .limit(limit)
            .skip(skip)
    }
};

exports.getAllNgoScheduledUsers = async (Id, userType, status, limit, skip) => {

    return await User.find({ ngoId: ObjectID(Id), userType: userType, userStatus: {$ne : "deleted"}, 
    verificationStatus: "unverified" }, { password: 0 })
    .populate([
        {
            path: 'appointmentId'
        }])
        .limit(limit)
        .skip(skip)
};

exports.getAllNgoUsersWithOutStatus = async (Id, currentUserId, type, limit, skip) => {
    if(type == "all"){
        return await User.find({ ngoId: ObjectID(Id), userStatus: {$ne : "deleted"},userType: {$nin : ["user","ngoadmin"]} }, { password: 0 })
        .limit(limit)
        .skip(skip)
    } else {
        return await User.find({ ngoId: ObjectID(Id), _id : {$ne: ObjectID(currentUserId)}, userStatus: {$ne : "deleted"} ,userType: type }, { password: 0 })
        .limit(limit)
        .skip(skip)
    }
};

exports.getAllNGOVerifiedUsers = async (Id) => {
    return await User.find({ createdBy: ObjectID(Id),
    userType: "user", userStatus: "active", verificationStatus: "verified" }, 
    { firstName: 1, lastName: 1, _id: 1, email : 1 })
};

exports.listNGOUnVerifiedUsers = async (Id) => {
    return await User.find({ createdBy: ObjectID(Id), 
    userType: "user", userStatus: "active", verificationStatus: "unverified" }, 
    { firstName: 1, lastName: 1, _id: 1, email : 1 })
};

exports.createUser = async (user) => {
    user.password = record.hashPassword(user.password);
    return await User.create(user);
};

exports.verifyNGOUser = async (Id, user) => {
    return await User.updateOne(
        {
            "_id": ObjectID(Id)
        },
        { "$set": user });
}

exports.setUnderAndOver18User = async (Id, user) => {
    return await User.updateOne(
        {
            "_id": ObjectID(Id)
        },
        { "$set": user });
}
exports.getUserById = async (id) => {
    return await User.findById(id, { password: 0 })
    .populate([
        {
            path: 'ngoId',select: { ngoName: 1}
        }
    ])
};

exports.findUserByEmail = async (email) => {
    return await User.findOne({ "email": email });
};

exports.updateUser = async (id, user) => {
    return await User.findByIdAndUpdate(id, user);
};

exports.deleteUser = async (id) => {
    return await User.findByIdAndDelete(id);
};