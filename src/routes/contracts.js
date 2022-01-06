const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('../model');
const { Op } = require("sequelize");
const {getProfile} = require('../middleware/getProfile');
var router = express.Router();
router.use(bodyParser.json());

/**
 * @returns contract by id
 */
 router.get('/:id',getProfile ,async (req, res) =>{
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const {profile} = req
    const contract = await Contract.findOne({where: {id}})
    if(!contract) return res.status(404).end()
    // We now test if profile is either the client or contractor one. Else we return 401 error (not authorized)
    // NOTA: we may think about returning 404 for security purpose if we want to secure it at max: giving a 401 error is already giving an information to hacker: the contract exists.
    if(contract.ClientId != profile.id && contract.ContractorId != profile.id) return res.status(401).end()
    res.json(contract)
})

/**
 * @returns contracts belonging to the caller (through his profile id)
 * In case of empty list, should still return a 200 http answer
 */
 router.get('/',getProfile ,async (req, res) =>{
    const {Contract} = req.app.get('models')
    const {profile} = req
    const contract = await Contract.findAll({where: {
                                                        [Op.or]: [
                                                            { ClientId: profile.id },
                                                            { ContractorId: profile.id }
                                                        ]
                                                    }
    })
    res.json(contract)
})

module.exports = router;
