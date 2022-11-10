//----------------- Importing Module and Packages -------------->
import orderModel from '../models/orderModel.js';
import { } from '../utility/validator.js';
import userModel from '../models/userModel.js';
import cartModel from '../models/cartModel.js';
import { isValidIncludes, isValid, isValidObjectId } from '../utility/validator.js';


//-----------------------------createOrder---------------------------->
const createOrder = async (req, res) => {
    try {
        let userId = req.params.userId
        let data = req.body
        let { cartId, cancellable, status } = data       //--DEstructuring obj

        //-------validation for empty Request body---------
        if (Object.keys(data).length == 0) {
            res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "user id is not valid" })
        }

        //----- find userID in user collection ----
        const validUser = await userModel.findById(userId);
        if (!validUser) {
            return res.status(404).send({ status: false, message: "User not present" })
        }

        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Please enter cartId" })
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "cart id is not valid" })
        }

        //-------find cartID in cart collection----------
        const findCart = await cartModel.findOne({ _id: cartId, userId: userId })

        if (!findCart) {
            return res.status(404).send({ status: false, message: "No cart found" })
        }

        let itemsArr = findCart.items   //to check card length, items=[proctid,price,quantity]
        if (itemsArr.length == 0) {
            return res.status(400).send({ status: false, message: "Cart is empty" })
        }

        let sum = 0
        for (let i of itemsArr) {
            sum += i.quantity
        }


        //----------creating  Object to add data------------
        let newData = {
            userId: userId,
            items: findCart.items,
            totalPrice: findCart.totalPrice,
            totalItems: findCart.totalItems,
            totalQuantity: sum
        }

        //validation
        if (isValidIncludes("cancellable", data)) {
            if (isValid(cancellable)) {
                return res.status(400).send({ status: false, message: "Please enter cancellable" })
            }
            if (![true, false].includes(cancellable)) {  //arr.include() or cancellable=="true"||cancellable=="false"
                return res.status(400).send({ status: false, message: "cancellable must be a boolean value" })
            }
            newData.cancellable = cancellable
        }

        if (isValidIncludes("status", data)) {
            if (!isValid(status)) {
                return res.status(400).send({ status: false, message: "Please enter status" })
            }
            if (!["pending", "completed", "canceled"].includes(status)) {
                return res.status(400).send({ status: false, message: "status must be a pending,completed,canceled" })
            }
            newData.status = status
        }

        //---------- Final Order creatation ---------------->
        const orderCreated = await orderModel.create(newData)

        //-----if order is done then cart will be empty-------
        cartModel.findOneAndUpdate({ _id: cartId }, { items: [], totalItems: 0, totalPrice: 0 })

        return res.status(201).send({ status: true, message: "Success", data: orderCreated })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};


//-------------------------updateOrder------------------------------------->
const updateOrder = async (req, res) => {
    try {
        let data = req.body
        let userId = req.params.userId   //userId is alredy validated in authorization
        let { orderId, status } = data

        if (Object.keys(data).length === 0) {
            return res.status(400).send({ status: false, msg: "No data to update" })
        }

        //----------------------------------Order Validation------------------------->
        if (!isValid(orderId)) {
            return res.status(400).send({ status: false, msg: "Please Enter orderId" })
        }
        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, msg: "Invalid orderId" })
        }

        //-------------- checking  Order status from DB   -------------->
        let existOrder = await orderModel.findOne({ _id: orderId, userId: userId })
        if (!existOrder) {
            return res.status(404).send({ status: false, msg: "No such order from this user" })
        }
        if (existOrder.isDeleted == true) {
            return res.status(400).send({ status: false, msg: "This Order is already deleted" })
        }

        if (existOrder.status === "completed") {
            return res.status(400).send({ status: false, msg: "This Order completed can'nt be cancelled" })
        }
        if (existOrder.status === "cancelled") {
            return res.status(400).send({ status: false, msg: "This Order is already cancelled" })
        }

        //--------------validating status of frontend---------
        if (!isValid(status)) {
            return res.status(400).send({ status: false, msg: "Please Enter status" })
        }
        if (!["pending", "completed", "cancelled"].includes(status)) {
            return res.status(400).send({ status: false, msg: "Status can only be Pending , Completed , Canceled " })
        }

        //------checking cancellable policy ---------------
        if (existOrder.cancellable == false && status == "cancelled") {
            return res.status(400).send({ status: false, msg: "This order is cannot Cancel " })
        }

        //------------ Fetch the Cart Data from DB of user  ------------>
        let findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) {
            return res.status(404).send({ status: false, msg: "There is no cart with these user" })
        }

        //-----------------------------------Update Order status--------------------->
        let updateOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: data }, { new: true })

        return res.status(200).send({ status: true, message: "Success", Data: updateOrder })

    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};



//--------------- Module Export -----------------//
export { createOrder, updateOrder }
