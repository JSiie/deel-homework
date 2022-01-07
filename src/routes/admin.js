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
    try{
        var start;
        var end;
        if(req.query['start']) start = Date.parse(req.query.start)
        else start = Date.parse('01 Jan 1970 00:00:00 GMT');
        if(req.query['end']) end = Date.parse(req.query.end)
        else end = Date.now();

        if(typeof start != "number") return res.status(500).send('wrong start date')
        if(typeof end != "number") return res.status(500).send('wrong end date')

        const job = await Job.findOne(  {   
            include: {
                model: Contract ,
                attributes: [],
                include: {
                    model: Profile,
                    as: 'Contractor',
                    attributes: ['profession'],
                }
            },
            where: {
                paid: true,
                paymentDate : {[Op.gte]: start},
                paymentDate : {[Op.lte]: end}
            },
            attributes: [
                [Sequelize.literal('"Contract->Contractor"."profession"'), 'profession'],
                [sequelize.fn('sum', sequelize.col('price')), 'total_amount'],
            ],
            group: ['Contract.Contractor.profession'],
            order: sequelize.literal('total_amount DESC')
        })
        res.json(job)
    }
    catch (error) {
        console.error(error);
        return res.status(500).end()
    }
    
})

/**
 * @returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.
 */
 router.get('/best-clients',getProfile ,async (req, res) =>{
    const {Job} = req.app.get('models')
    const {Profile} = req.app.get('models')
    const {Contract} = req.app.get('models')
    try{
        var start;
        var end;
        var limit = 2;
        if(req.query['start']) start = Date.parse(req.query.start)
        else start = Date.parse('01 Jan 1970 00:00:00 GMT');
        if(req.query['end']) end = Date.parse(req.query.end)
        else end = Date.now();
        if(req.query['limit']) limit = parseInt(req.query.limit)

        if(typeof start != "number") return res.status(500).send('wrong start date')
        if(typeof end != "number") return res.status(500).send('wrong end date')
        if(limit <= 0) return res.status(500).send('limit must be positive')

        const job = await Job.findAll(  {   
            include: {
                model: Contract ,
                attributes: [],
                include: {
                    model: Profile,
                    as: 'Client',
                    attributes: ['id', 'firstName'],
                }
            },
            where: {
                paid: true,
                paymentDate : {[Op.gte]: start},
                paymentDate : {[Op.lte]: end}
            },
            attributes: [
                [Sequelize.literal('"Contract->Client"."id"'), 'id'],
                [Sequelize.literal('"Contract->Client"."firstname" || " " || "Contract->Client"."lastname"'), 'fullName'],
                [sequelize.fn('sum', sequelize.col('price')), 'paid'],
            ],
            group: ['Contract.Client.id'],
            order: sequelize.literal('paid DESC'),
            limit: limit
        })
        res.json(job)
    }
    catch (error) {
        console.error(error);
        return res.status(500).end()
    }
    
})

module.exports = router;
