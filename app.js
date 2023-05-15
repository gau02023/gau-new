var createError = require('http-errors');
var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
global.__basedir = __dirname;

//general routes
var routeUser = require('./api/routes/users.js');
var routeNgo = require('./api/routes/ngo.js');
var routeSchedule = require('./api/routes/schedule.js');
var routeLookup = require('./api/routes/lookup.js');
var routeCase = require('./api/routes/case.js');
var routeAppointment = require('./api/routes/appointment.js');
var routeDonation = require('./api/routes/donation.js');
var routeComplaints = require('./api/routes/complaints.js');
var routeProjects = require('./api/routes/project.js');
var routeTranslation = require('./api/routes/translation.js');

var cors = require('cors')

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

let dev_db_url = 'mongodb://localhost:27017/GAU';
let mongoDB = process.env.MONGODB_URI || dev_db_url;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology : true, useCreateIndex : true })
.then(() => console.log('MongoDB connected…'))
.catch(err => console.log(err));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(logger('dev'));

// Api request limit increase to 50mb for base64 string (image upload)
app.use(express.json({limit: '300mb', extended: true}));
app.use(express.urlencoded({limit: '250mb', extended: true }));

app.use(cookieParser());

// routes call
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to GAU Backend"
})
});

//General Routes
app.use('/api/user', routeUser);
app.use('/api/ngo', routeNgo);
app.use('/api/schedule', routeSchedule);
app.use('/api/case', routeCase);
app.use('/api/lookup', routeLookup);
app.use('/api/appointment', routeAppointment);
app.use('/api/donation', routeDonation);
app.use('/api/complaints', routeComplaints);
app.use('/api/project', routeProjects);
app.use('/api/translation', routeTranslation);


app.use('/reports', express.static(__dirname + '/reports'));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    msg : err.message
  });
});

var port = process.env.PORT || 3300;

app.listen(port, () => {
    console.log('Server is up and running on port number ' + port);
});



module.exports = app;
