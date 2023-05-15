var Schedule = require("../api/models/schedule");
var Appointment = require("../api/models/appointment");
var User = require("../api/models/user");
var NGO = require("../api/models/ngo");
const ObjectID = require('mongodb').ObjectId;
var moment = require('moment');

function getDates(startDate, endDate) {
    const dates = []
    let currentDate = startDate
    const addDays = function (days) {
        const date = new Date(this.valueOf())
        date.setDate(date.getDate() + days)
        return date
    }
    while (currentDate <= endDate) {
        dates.push(currentDate)
        currentDate = addDays.call(currentDate, 1)
    }
    return dates
}

function addtime(time, min) {
    let times = time.split(":");

    min = min % (24 * 60);
    times[0] = (parseInt(times[0])) + parseInt(min / 60);
    times[1] = parseInt(times[1]) + min % 60;

    if (times[1] >= 60) { times[1] = 0; times[0]++ };
    times[0] >= 24 ? times[0] -= 24 : null;


    times[0] < 10 ? times[0] = "0" + times[0] : null;
    times[1] < 10 ? times[1] = "0" + times[1] : null;

    return times.join(":");
}
function convertHours(timeStart, timeEnd) {

    var timeSeries = [];
    let timeStartSplit = timeStart.split(":");
    let timeEndSplit = timeEnd.split(":");
    let difference = parseInt(timeEndSplit) - parseInt(timeStartSplit)
    if(difference > 0) {
        var addedHours = "";
        for(var i = 0; i < difference; i++){
            
            if(i == 0){
                var getHourlyTime = addtime(timeStart, 60)
                timeSeries.push({
                    "timeStartSlot": timeStart,
                    "timeEndSlot": getHourlyTime
                })
                addedHours = "";
                addedHours = getHourlyTime;
            } else {
                var getHourlyTime = addtime(addedHours, 60)
                timeSeries.push({
                    "timeStartSlot": addedHours,
                    "timeEndSlot": getHourlyTime
                })
                addedHours = "";
                addedHours = getHourlyTime;
            }
        }
    } else {
        timeSeries.push({
            "timeStartSlot": timeStart,
            "timeEndSlot": timeEnd
        })
    }
    return timeSeries;
}

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    hours = hours % 12;
    hours = hours < 10 ? '0'+hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes;
    return strTime;
  }

module.exports.setInsertData = function (data) {
    let dataInsert = [];
    var tr = convertHours(data.timeStartSlot, data.timeEndSlot);
    var dr = getDates(new Date(data.dateStart), new Date(data.dateEnd));
    data.users.forEach(element => {
        var splitStart = data.timeStartSlot.toString().split(":");
        var splitEnd = data.timeEndSlot.toString().split(":");
        var el = {};
        el["ngoId"] = data.ngoId;
        el["branchId"] = data.branchId;
        el["scheduleType"] = data.scheduleType;
        el["dateStart"] = new Date(data.dateStart);
        el["dateEnd"] = new Date(data.dateEnd);
        el["userId"] = element;
        el["timeStartSlot"] = data.timeStartSlot;
        el["timeEndSlot"] = data.timeEndSlot;
        el["timeStartFirstHalf"] = parseInt(splitStart[0]);
        el["timeEndFirstHalf"] = parseInt(splitEnd[0]);
        el["scheduleStatus"] = "active";
        if (data.dateEnd > data.dateStart) {
            if (dr.length > 0) {
                dr.forEach(el => {
                    if(tr.length < 1) {
                        var dateRangeAdd = {
                            "ngoId": data.ngoId,
                            "branchId": data.branchId,
                            "scheduleType": data.scheduleType,
                            "dateStart": el,
                            "dateEnd": el,
                            "userId": element,
                            "timeStartSlot": data.timeStartSlot,
                            "timeEndSlot": data.timeEndSlot,
                            "timeStartFirstHalf" : parseInt(splitStart[0]),
                            "timeEndFirstHalf" : parseInt(splitEnd[0]),
                            "scheduleStatus": "active"
                        };
                        dataInsert.push(dateRangeAdd)
                    } else {
                        tr.forEach(slot => {
                            var dateRangeAdd = {
                                "ngoId": data.ngoId,
                                "branchId": data.branchId,
                                "scheduleType": data.scheduleType,
                                "dateStart": el,
                                "dateEnd": el,
                                "userId": element,
                                "timeStartSlot": slot.timeStartSlot,
                                "timeEndSlot": slot.timeEndSlot,
                                "timeStartFirstHalf" : parseInt(splitStart[0]),
                                "timeEndFirstHalf" : parseInt(splitEnd[0]),
                                "scheduleStatus": "active"
                            };
                            dataInsert.push(dateRangeAdd)
                        })
                    }
                })
            }
        } else {
            dataInsert.push(el);
        }
    });
    return dataInsert;
}

module.exports.generateResponse = async function (data) {
    try {
        var result = [];
        const promiseArr = [];
        return new Promise((resolve, reject) => {
            data.forEach(element => {
                promiseArr.push(
                    new Promise(async (resolvve, rejectt) => {
                        let findBranch = element.ngoId.ngoBranches.find(o => o._id == element.branchId);
                        var checkSchedule = await Appointment.findOne({ scheduleId: ObjectID(element._id),
                            appointmentStatus: {$nin : ["cancelled","closed"]} });
                        var scheduleExist = false;
                        var appointmentId = "N/A";
                        if (checkSchedule) { 
                            scheduleExist = true;
                            appointmentId = checkSchedule._id
                        }
                        if(findBranch){
                            var response = {
                                "NGOName": element.ngoId.ngoName,
                                "branchName": findBranch.branchName,
                                "timeStart": element.timeStartSlot,
                                "timeEnd": element.timeEndSlot,
                                "dutyDate": element.dateStart.toISOString().split('T')[0],
                                "branchId": element.branchId,
                                "ngoId": element.ngoId._id,
                                "scheduleId": element._id,
                                "userId": element.userId,
                                "booked": scheduleExist,
                                "appointmentId": appointmentId,
                                "dDate": element.dateStart
                            }
                            result.push(response);
                        }
                        resolvve(result);
                    })
                )
            })
            return Promise.all(promiseArr).then(ress => {
                resolve(result.sort((a, b) => moment(b.dDate, 'DD-MM-YYYY').diff(moment(a.dDate, 'DD-MM-YYYY'))))
            })
        })
    } catch(error) {
        console.log(error)
    }
    
}

module.exports.checkUserSchedule = async function (data) {
    const promiseArr = [];
    var result = [];
    return new Promise((resolve, reject) => {
        data.users.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    let resp = {
                        scheduleMessage: ""
                    };
                    /* check if between dates userId exist */
                    var checkUserDates = await Schedule.countDocuments(
                        {
                            userId: ObjectID(element),
                            "dateStart": { $gte: new Date(data.dateStart).toISOString() },
                            "dateEnd": { $lte: new Date(data.dateEnd).toISOString() },
                            // "timeStartSlot": data.timeStartSlot,
                            // "timeEndSlot": data.timeEndSlot,
                            "scheduleStatus": "active"
                           // "branchId": data.branchId
                        })
                    if (checkUserDates > 0) {
                        var findUser = await User.findOne({ _id: element });
                        var findNGO = await NGO.findOne({ _id: data.ngoId });

                        let findBranch = findNGO.ngoBranches.find(o => o._id == data.branchId);
                        resp.scheduleMessage = "Schedule exist for " + findUser.firstName + " " + findUser.lastName
                            + " between dates " + data.dateStart + " and " + data.dateEnd
                            + " on " + data.timeStartSlot + " and " + data.timeEndSlot
                            + " in branch ( " + findBranch.branchName + " )";
                        result.push(resp);
                    }
                    resolvve(result)
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result)
        })

    })
}

module.exports.getSignificantDates = async function (data) {
    const uniqueDates = [...new Set(data.map(obj => obj.dutyDate))];
    return uniqueDates;
}

module.exports.getNGOUsersAndSchedules = async function (userId, ngoId, date) {
    const promiseArr = [];
    var result = [];
    var getNgoUsers = await User.find({ ngoId: ngoId, userType: { $nin: ["user", "ngoadmin"] }, userStatus: "active" });
    return new Promise((resolve, reject) => {
        getNgoUsers.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var response = {
                        fullName: element.firstName + " " + element.lastName,
                        profileImage: element.profileImage ? element.profileImage : "N/A",
                        userId: element._id,
                        //schedule: [],
                        schedule: false,
                        branches: [],
                        role: element.userType
                    }
                    var checkUserDates = await Schedule.find(
                        {
                            userId: ObjectID(element._id),
                            "dateStart": { $gte: new Date(new Date().setHours(0, 0, 0, 0)).toISOString() },
                            "scheduleStatus": "active"
                        })
                    const uniqueBranches = [...new Set(checkUserDates.map(item => item.branchId))];
                    response.branches = await this.findNGOBranches(uniqueBranches);
                    //response.schedule = checkUserDates;

                    if (checkUserDates.length > 0) {
                        response.schedule = true;
                    }
                    result.push(response)
                    resolvve(result)
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result)
        })

    })
}

module.exports.getNGOUsersAndSchedules2 = async function (date, ngoId, type, slot) {
    const promiseArr = [];
    var result = [];
    let slotSplit = slot.toString().split("-");
    if(slot != "") {
        slotSplit = slot.toString().split("-");
    }
    let currentDate = moment().format('HH')
   
    
    var getNgoUsers = await User.find({ ngoId: ngoId, userType: type, userStatus: "active" });
    return new Promise((resolve, reject) => {
        getNgoUsers.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var checkUserDates;
                    if(slot != "") {
                        checkUserDates= await Schedule.find(
                            {
                                userId: ObjectID(element._id),
                                "dateStart": { $gte: new Date(date).toISOString() },
                                "dateEnd": { $lte: new Date(date).toISOString() },
                                "timeStartSlot": slotSplit[0],
                                "timeEndSlot": slotSplit[1],
                                "scheduleStatus": "active"
                            })
                    } else {
                        checkUserDates = await Schedule.find(
                            {
                                userId: ObjectID(element._id),
                                "dateStart": { $gte: new Date(date).toISOString() },
                                "dateEnd": { $lte: new Date(date).toISOString() },
                                "timeEndFirstHalf": { $gt: currentDate },
                                "scheduleStatus": "active"
                            })
                    }
                    var resp = await this.GenerateNGOUserSchedule2Response(checkUserDates, element, type)
                    if(resp.length > 0){
                        result.push(resp)
                    }
                   
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            var finalRes = []
            for(var i = 0; i < result.length; i++){
                for(var j = 0; j < result[i].length; j++){
            
                    finalRes.push(result[i][j]);
                }
            }
            resolve(finalRes)
        })
    })
}

module.exports.findNGOBranches = async function (data) {
    const promiseArr = [];
    var result = [];
    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {

                    var findBranch = await NGO.findOne(
                        {
                            "ngoBranches._id": ObjectID(element)
                        })
                    if (findBranch) {
                        let findBr = findBranch.ngoBranches.find(o => o._id == element);
                        var branchData = {
                            "branchId": element,
                            "branchName": findBr.branchName
                        }
                        result.push(branchData);
                    }
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result)
        })
    })
}

module.exports.GenerateNGOUserSchedule2Response = async function (data, user,type) {
    const promiseArr = [];
    var result = [];
   // var resp;
    return new Promise((resolve, reject) => {
        data.forEach(el => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {
                    var checkAppointment = await Appointment.findOne({scheduleId: ObjectID(el._id)});
                    
                    if(!checkAppointment){
                              var  resp = {
                                    scheduleId: el._id,
                                    fullName: user.firstName + " " + user.lastName,
                                    scheduleStatus: el.scheduleStatus,
                                    branchId: el.branchId,
                                    dateStart: el.dateStart,
                                    dateEnd: el.dateEnd,
                                    userId: el.userId,
                                    timeStartSlot: el.timeStartSlot,
                                    timeEndSlot: el.timeEndSlot,
                                    role: type,
                                    profileImage: user.profileImage ? user.profileImage : ""
                                };  
                                result.push(resp)
                    }
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.dateStart, 'DD-MM-YYYY').diff(moment(a.dateStart, 'DD-MM-YYYY'))))
        })
    })
}


module.exports.generatUserScheduleResponse = async function (data) {
    const promiseArr = [];
    var result = [];
    return new Promise((resolve, reject) => {
        data.forEach(element => {
            promiseArr.push(
                new Promise(async (resolvve, rejectt) => {

                    var findSchedule = await Schedule.findOne(
                    {
                        "_id": ObjectID(element.appointmentId.scheduleId)
                    })
                    if(findSchedule){
                        var el = {
                            userStatus: element.userStatus,
                            verificationStatus: element.verificationStatus,
                            userType: element.userType,
                            _id: element._id,
                            firstName: element.firstName,
                            lastName: element.lastName,
                            email: element.email,
                            phoneNumber: element.phoneNumber,
                            profileImage: element.profileImage,
                            ngoId: element.ngoId,
                            scheduleId: element.appointmentId.scheduleId,
                            IDDetails: element.IDDetails,
                            scheduleTime: findSchedule.timeStartSlot +"-"+findSchedule.timeEndSlot,
                            scheduleDate: findSchedule.dateStart
                        }
                        result.push(el);
                    }
                  
                    resolvve(result);
                })
            )
        })
        return Promise.all(promiseArr).then(ress => {
            resolve(result.sort((a, b) => moment(b.scheduleDate, 'DD-MM-YYYY').diff(moment(a.scheduleDate, 'DD-MM-YYYY'))))
        })
    })
}