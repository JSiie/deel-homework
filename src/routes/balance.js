const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('../model');
const Sequelize = require('sequelize');
const { Op } = require("sequelize");
const {getProfile} = require('../middleware/getProfile');
var router = express.Router();
router.use(bodyParser.json());

/**
 * @returns nothing, must do a deposit and change accordingly the balance of client account
 * the client cannot deposit more than 25% of total jobs to pay
 * We may use a transaction to ensure that this rule cannot be broken through multiple calls
 * Transaction should start by locking the client account, then doing the condition. else conditions could be true in 2 different calls
 */
 router.post('/deposit/:amount',getProfile ,async (req, res) =>{
    const {Job} = req.app.get('models')
    const {Profile} = req.app.get('models')
    const {Contract} = req.app.get('models')
    const {amount} = req.params
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
        if(!(client_profile.type === 'client')){
            //contractor are not authorized to deposit
            await transaction.rollback()
            return res.status(401).end()
        }
        const job = await Job.sum('price',  {  
            include: {
                model: Contract ,
                where: {
                    ClientId: profile.id
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
        if(!job){
            await transaction.rollback()
            return res.status(404).end()
        }
        if(parseInt(job) / 4 < parseInt(amount)){
            await transaction.rollback()
            return res.status(401).send("You cannot deposit more than 25% of total unpaid jobs");
        }
        await client_profile.update({balance: client_profile.balance + parseInt(amount)}, {transaction: transaction})
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
