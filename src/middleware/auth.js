//----------------- Importing Module and Packages -------------->
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose'
const ObjectId = mongoose.Types.ObjectId
import userModel from '../models/userModel.js';


//------------------------authorization------------------------>
const authentication = async (req, res, next) => {
    try {
        let token = req.headers.authorization
        if (!token)
            res.status(400).send({ status: false, message: `Token must be present.` })

        token = req.headers.authorization.slice(7); //sliceing from Bearrer token(1st 7 space/digit)

        //===================== Verify token & asigning it's value in request body =====================//
        let decodedToken = jwt.verify(token, 'group1');
        if (!decodedToken) return res.status(400).send({ status: false, msg: "Token Not Verified Please Enter Valid Token" });

        req.decodedToken = decodedToken;
        next();
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}


//------------------------authorization------------------------>
const authorization = async (req, res, next) => {
    try {
        const userId = req.params.userId;   // pass user id in path params
        const userLoggedIn = req.decodedToken.userId;  //Accessing userId from token attribute

        if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" });
        }

        //----------------- Fetching All User Data from DB ------------>
        let userExits = await userModel.findById(userId)
        if (!userExits) return res.status(404).send({ status: false, message: "User Does Not Exist" })


        //--------------- Checking the userId is Authorized Person or Not ----------------->
        if (userLoggedIn != userId)
            return res.status(403).send({ status: false, msg: "Error, authorization failed" });
        else next()
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}


export { authentication, authorization };




