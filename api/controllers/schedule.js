/* Schedule Controller */
var Schedule = require("../models/schedule.js");
const ObjectID = require('mongodb').ObjectId;

exports.getAllSchedule = async () => {
    return await Schedule.find();
};
exports.getAllScheduleUsers = async (Id) => {
    return await Schedule.find({ createdBy: ObjectID(Id) })
};

exports.listAllSchedules = async (Id) => {
    return await Schedule.find({ createdBy: ObjectID(Id) })
};

exports.getScheduleByUser = async (Id) => {
    return await Schedule.findOne({ createdBy: ObjectID(Id) })
};

exports.checkUserSchedule = async (Id) => {
    return await Schedule.findOne({ userId: ObjectID(Id), "dateStart": { $gte: new Date() } })
};

exports.getScheduleByDate = async (Id, ngoId, date) => {
    var now = new Date();
    if(date) {
        return await Schedule.find({ userId: ObjectID(Id), ngoId: ObjectID(ngoId), dateStart: date,
            scheduleStatus: "active" })
        .sort({dateStart: 1})
        .populate("ngoId")
    } else {
        return await Schedule.find({ userId: ObjectID(Id),  ngoId: ObjectID(ngoId), 
            "dateStart": { $gte: new Date().toISOString() }, 
            "dateEnd": { $lte : new Date(now.getFullYear(), now.getMonth() + 1, 1)}
            ,scheduleStatus: "active" })
        .sort({dateStart: 1})
        .populate("ngoId")
    }
};

exports.getNGOUserSchedules = async (Id, date) => {
    return await Schedule.find({ ngoId: ObjectID(Id), "dateStart": { $gte: new Date(date).toISOString() },
    scheduleStatus: "active"})
    .sort({dateStart: 1})
    .populate("ngoId")
};

exports.createSchedule = async (schedule) => {
    return await Schedule.insertMany(schedule);
};
exports.getScheduleById = async (id) => {
    return await Schedule.findById(id);
};

exports.updateSchedule = async (id, schedule) => {
    return await Schedule.findByIdAndUpdate(id, schedule);
};

exports.deleteSchedule = async (id) => {
    return await Schedule.findByIdAndDelete(id);
};