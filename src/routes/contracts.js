const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('../model')
const {getProfile} = require('../middleware/getProfile')
var router = express.Router();
router.use(bodyParser.json());

/**
 * @returns contract by id
 */
 router.get('/:id',getProfile ,async (req, res) =>{
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const contract = await Contract.findOne({where: {id}})
    if(!contract) return res.status(404).end()
    // We now test if profile is either the client or contractor one. Else we return 401 error (not authorized)
    // NOTA: we may think about returning 404 for security purpose if we want to secure it at max: giving a 401 error is already giving an information to hacker: the contract exists.
    if(contract.ClientId != req.profile.id && contract.ContractorId != req.profile.id) return res.status(401).end()
    res.json(contract)
})
module.exports = router;
