const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

var route_contract = require('./routes/contract');
var route_job = require('./routes/job');
var route_balance = require('./routes/balance');
var route_admin = require('./routes/admin');

app.use('/contracts', route_contract);
app.use('/jobs', route_job);
app.use('/balances', route_balance);
app.use('/admin', route_admin);

module.exports = app;
