const express = require('express');
const app = express();
const router = express.Router();

const {User, Account} = require('../db')
const jwt = require("jsonwebtoken")
const z = require('zod')
require("dotenv").config();
const { authMiddleware } = require("../middleware"); 

const userValidation = z.object({
    username: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    password: z.string().min(6)
})

router.post("/signup", async (req, res) => {
    const validInputs = userValidation.safeParse(req.body);
    if(!validInputs.success){
        return res.status(411).json({
            message : "Email id already taken /Invalid inputs"
        });
    }

    try {
        const response = await User.findOne({
            username: req.body.username
        })

        if (response) {
            return res.status(411).json({
                message: "Email id already taken /Invalid inputs"
            });
        }

        const userCreated = await User.create({
            username: req.body.username,
            password: req.body.password,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
        });

        const userID = userCreated._id;
        await Account.create({
            userID,
            balance: 1 + Math.random() * 10000
        })
        const token = jwt.sign({
            userID
        }, process.env.JWT_SECRET);

        return res.status(200).json({
            message: "User created successfully",
            token: token
        });
    } catch (e) {
        console.error("Signup error:", e); 
        return res.status(500).json({
            message: "Server error"
        })
    }
});

const signinBody = z.object({
    username: z.string().email(),
	password: z.string()
});

router.post("/signin", async (req,res) => {
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        });
    }
    
    try {
        const userFound = await User.findOne({
        username : req.body.username,
        password : req.body.password
        })
        if(userFound){
            const userID = userFound._id;
            const token = jwt.sign({
                userID
            }, process.env.JWT_SECRET );

            return res.status(200).json({
                token : token
            })
        } else {
            return res.status(411).json({
                message: "Invalid username or password"
            });
        }
    } catch(e) {
        res.status(411).json({
            message: "Error while logging in"
        });
    }
});

const updateBody = z.object({
    password : z.string().min(6).optional(),
    firstName : z.string().optional(),
    lastName : z.string().optional()
});

router.put("/", authMiddleware , async (req,res) => {
    const {success} = updateBody.safeParse(req.body);
    if(!success) {
        return res.status(411).json({
            message: "Incorrect inputs"
        });
    }

    await User.updateOne({_id : req.userID}, req.body);

    return res.json({
        message : "User updated successfully"
    })
});

router.get("/bulk", authMiddleware, async (req,res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
});


module.exports = router;