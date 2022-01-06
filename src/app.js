const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

var route_contracts = require('./routes/contracts');
var route_jobs = require('./routes/jobs');

app.use('/contracts', route_contracts);
app.use('/jobs', route_jobs);

module.exports = app;
