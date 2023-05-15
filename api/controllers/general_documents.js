var GeneralDocumets=require('../models/general_documents.js');
const ObjectID = require('mongodb').ObjectId;

/******************* Add Documents ***************************/
exports.createDocuments = async (document) => {
    return await GeneralDocumets.create(document);
};

/******************* List Documents ***************************/
exports.listDocuments = async (userType, ngoId,userId) => {
    if(userType == "user"){
        return await GeneralDocumets.find({status: {$ne : "deleted"}, createdBy: ObjectID(userId)});
    } else {
        return await GeneralDocumets.find({status: {$ne : "deleted"}, ngoId: ObjectID(ngoId)});
    }
 
};

/******************* List Documents ***************************/
exports.listSpecificUserDocuments = async (userId) => {
    return await GeneralDocumets.find({status: {$ne : "deleted"}, createdBy: ObjectID(userId)});
 
};

/******************* List Documents ***************************/
exports.countDocuments = async (userType, ngoId,userId) => {
    if(userType == "ngoadmin"){
        return await GeneralDocumets.countDocuments({status: {$ne : "deleted"}, ngoId: ObjectID(ngoId)});
    } else {
        return await GeneralDocumets.countDocuments({status: {$ne : "deleted"}, createdBy: ObjectID(userId)});
    }
 
};