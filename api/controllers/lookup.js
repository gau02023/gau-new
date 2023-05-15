var Lookup=require('../models/lookup.js');
var Document=require('../models/document.js');

/******************* Add Lookup ***************************/
exports.addLookup = async (lookup) => {
    return await Lookup.create(lookup);
};

/******************* Get Lookup By Type ***************************/
exports.getLookupByType = async (type) => {
    return await Lookup.find({ state: "active", lookupType: type })
};

/******************* Add Documents ***************************/
exports.createDocuments = async (document) => {
    return await Document.create(document);
};

/******************* List Documents ***************************/
exports.listDocuments = async () => {
    return await Document.find({status: "active"})
        .populate([
            {
                path: 'lookupId', select: { lookupName: 1}
            }])
};