const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('../model');
const Sequelize = require('sequelize');
const { Op } = require("sequelize");
const {getProfile} = require('../middleware/getProfile');
var router = express.Router();
router.use(bodyParser.json());

/**
 * @returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.
 */
 router.get('/best-profession',getProfile ,async (req, res) =>{
    const {Job} = req.app.get('models')
    const {Profile} = req.app.get('models')
    const {Contract} = req.app.get('models')
    const {profile} = req
    try{
        var start;
        var end;
        if(req.query['start']) start = Date.parse(req.query.start)
        else start = Date.parse('01 Jan 1970 00:00:00 GMT');
        if(req.query['end']) end = Date.parse(req.query.end)
        else end = Date.now();


        console.log(start)
        if(typeof start != "number") return res.status(500).send('wrong start date')
        if(typeof end != "number") return res.status(500).send('wrong end date')

        const contractor_profile = await Profile.findOne({where: {id: profile.id }});
        if(!contractor_profile){
            //we should never be there, as the middleware has already find the profile
            return res.status(500).end()
        }
        if(!(contractor_profile.type === 'contractor')){
            //we should never be there, as the middleware has already find the profile
            return res.status(401).end()
        }
        const job = await Job.findOne(  {   
            include: {
                model: Contract ,
                attributes: ['ContractorId']
            },
            where: {
                paid: true,
                paymentDate : {[Op.gte]: start},
                paymentDate : {[Op.lte]: end}
            },
            attributes: [
                'Contract.ContractorId',
                [sequelize.fn('sum', sequelize.col('price')), 'total_amount'],
            ],
            group: ['Contract.ContractorId'],
            order: sequelize.literal('total_amount DESC')
        })
        res.json(job)
    }
    catch (error) {
        console.error(error);
        return res.status(500).end()
    }
    
})

module.exports = router;
