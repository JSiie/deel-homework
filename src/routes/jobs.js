const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('../model');
const { Op } = require("sequelize");
const {getProfile} = require('../middleware/getProfile');
var router = express.Router();
router.use(bodyParser.json());

/**
 * @returns unpaid jobs for a profile. Only active contracts have to be returned
 */
 router.get('/unpaid',getProfile ,async (req, res) =>{
    const {Job} = req.app.get('models')
    const {Contract} = req.app.get('models')
    const {profile} = req
    const job = await Job.findAll(  {   
                                        include: {
                                            model: Contract ,
                                            where: {
                                                [Op.or]: [
                                                    { ClientId: profile.id },
                                                    { ContractorId: profile.id }
                                                ]
                                            }
                                        },
                                        where: {
                                            paid: { [Op.or]: [
                                                        {[Op.eq]: null},
                                                        {[Op.eq]: false}
                                                    ]
                                            }
                                        }
                                    })
    res.json(job)
})

module.exports = router;
