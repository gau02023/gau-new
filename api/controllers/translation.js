var Translation=require('../models/translation');
const ObjectID = require('mongodb').ObjectId;

/******************* Add Translation ***************************/
exports.addTranslation = async (trs) => {
    return await Translation.create(trs);
};

/******************* List Translation ***************************/
exports.listTranslation = async (trsId) => {
    return await Translation.find({languageId : ObjectID(trsId), status: "active"})
    .populate([
        {
            path: 'languageId', select: { lookupName: 1, lookupType : 1}
        }])
};

exports.updateTranslation = async (id, trs) => {
    return await Translation.findByIdAndUpdate(id, trs);
};

/******************* List All Translation ***************************/
exports.listAllTranslation = async () => {
    return await Translation.find({status: "active"})
    .populate([
        {
            path: 'languageId', select: { lookupName: 1, lookupType : 1}
        }])
};