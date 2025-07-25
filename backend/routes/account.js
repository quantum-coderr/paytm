const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account } = require('../db');
const { default: mongoose } = require('mongoose');


const router = express.Router();

router.get("/balance", authMiddleware, async (req , res) => {
    const userID = req.userID;
    const account = await Account.findOne({
        userID : userID
    })

    return res.status(200).json({
        balance : account.balance
    });
});

router.post("/transfer", authMiddleware, async (req,res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const { amount, to } = req.body;

    const account = await Account.findOne({ userID: req.userID }).session(session);

    if (!account || account.balance < amount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }

    const toAccount = await Account.findOne({ userID: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Invalid account"
        });
    }

    await Account.updateOne({ userID: req.userID }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userID: to }, { $inc: { balance: amount } }).session(session);

    // Commit the transaction
    await session.commitTransaction();

    res.json({
        message: "Transfer successful"
    });
});

module.exports = router;