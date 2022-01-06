const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('../model');
const Sequelize = require('sequelize');
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

/**
 * @returns pay for a job
 * There is a concurrent access possible:
 * if we check balance then initiate payment, balance could change in the meantime
 * If we initiate payment, we need a safe way to manage balances 
 * We solve this through transaction
 */
 router.post('/:job_id/pay',getProfile ,async (req, res) =>{
    const {Job} = req.app.get('models')
    const {Profile} = req.app.get('models')
    const {Contract} = req.app.get('models')
    const {job_id} = req.params
    const {profile} = req
    try {
        var transaction = await sequelize.transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
            lock: Sequelize.Transaction.LOCK.UPDATE,
            types: Sequelize.Transaction.TYPES.IMMEDIATE
        });
        const client_profile = await Profile.findOne({where: {id: profile.id }}, {transaction: transaction});
        if(!client_profile){
            //we should never be there, as the middleware has already find the profile
            await transaction.rollback()
            return res.status(500).end()
        }
        const job = await Job.findOne(  {  
            include: {
                model: Contract ,
                where: {
                    ClientId: profile.id
                }
            },
            where: {
                [Op.and]: [
                    {id: job_id},
                    {paid: { [Op.or]: [
                                {[Op.eq]: null},
                                {[Op.eq]: false}
                            ]
                    }}
                ]
            }
        }, {transaction: transaction})
        const contractor_profile = await Profile.findOne({where: {id: job.Contract.ContractorId }}, {transaction: transaction});
        if(!client_profile){
            //we should never be there, as the contractor must exist
            await transaction.rollback()
            return res.status(500).end()
        }
        if(!job){
            await transaction.rollback()
            return res.status(404).end()
        }
        if(job.price > client_profile.balance){
            await transaction.rollback()
            return res.status(406).send("You don't have enough funds on your account to pay this job");
        }
        await client_profile.update({balance: client_profile.balance - job.price}, {transaction: transaction})
        await contractor_profile.update({balance: contractor_profile.balance + job.price }, {transaction: transaction})
        await job.update({paid: true }, {transaction: transaction})
        await transaction.commit();
        return res.status(204).end()
    } catch (error) {
        //simple way to see errors but we should log in logfile in prod
        console.error(error);
        await transaction.rollback()
        return res.status(500).end()
    }
    
})

module.exports = router;
