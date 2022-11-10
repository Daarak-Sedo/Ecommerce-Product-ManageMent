//----------------- Importing Module and Packages -------------->
import productModel from '../models/productModel.js';
import uploadFile from "../utility/aws-S3_.js";
import { isValidObjectId, isValid, isValidPrice, isBoolean, isValidString, isValidNum } from '../utility/validator.js';
import getSymbolFromCurrency from 'currency-symbol-map'


//--------------------createProduct --------------------------------->
const createProduct = async (req, res) => {
    const file = req.files;
    const data = req.body;
    //---------- Destructuring User Body Data --------->
    const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

    //-----------------body validation------------------------->
    if (Object.keys(data).length === 0)
        return res.status(400).send({ status: false, message: `Please provide product details` });

    if (Object.keys(data).length > 12)
        return res.status(400).send({ status: false, message: `You can't add extra field` });

    if (!isValid(title))
        return res.status(400).send({ status: false, message: `Title is required and should be a valid string.` })

    const dupTitle = await productModel.findOne({ title })
    if (dupTitle)
        return res.status(400).send({ status: false, message: `This title is already in use` })

    if (!isValid(description))
        return res.status(400).send({ status: false, message: `Description is required and should be a valid string.` })

    if (!isValidPrice(price))
        return res.status(400).send({ status: false, message: `Price is required and should be a valid price e.g(54,589.23,6726,etc).` })

    if (!isValid(currencyId))
        return res.status(400).send({ status: false, message: `Currency id is required and should be a valid string.` })

    if (currencyId !== 'INR')
        return res.status(400).send({ status: false, message: ` currency id should be the INR .` })

    if (!currencyFormat)
        return res.status(400).send({ status: false, message: `Please enter  currencyFormat (INR) to get the currency format ₹ ` })

    const symbol = getSymbolFromCurrency('INR')    //generating symbull from inbuilt function in npm module 
    data['currencyFormat'] = symbol
    // console.log(symbol)

    if (isFreeShipping) {
        if (!isBoolean(isFreeShipping))
            return res.status(400).send({ status: false, message: "Is free Shipping value should be boolean" })
    }

    if (style) {
        if (!isValidString(style))
            return res.status(400).send({ status: false, message: "Style should be a valid string" })
    }

    if (!isValid(availableSizes))
        return res.status(400).send({ status: false, message: "Please enter available sizes,it is required" })

    if (availableSizes) {
        let sizeArray = availableSizes.split(',').map((item) => item.trim())  //if user provides multipal size-  M  ,      S will be="M","S"      //console.log(sizeArray)
        for (let i = 0; i < sizeArray.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XL", "XXL"].includes(sizeArray[i]))) {
                return res.status(400).send({ status: false, message: `Please enter size from available sizes ["S","XS","M","X","L","XL","XXL"]` })
            }
        }
        data['availableSizes'] = sizeArray
    }

    if (installments) {
        if (!isValidNum(installments)) return res.status(400).send({ status: false, message: "Installments should be a valid number" })
    }

      //------------- Checking the File is present or not and Create S3 Link ------------>
    if (!(file && file.length)) return res.status(400).send({ status: false, message: "No file found" })

    let uploadedFileUrl = await uploadFile(file[0])
    data['productImage'] = uploadedFileUrl


    //-------------- Finaly Creation of Product -------------->
    const saveProduct = await productModel.create(data)
    return res.status(201).send({ status: true, message: "Product created successfully", data: saveProduct })
};



//---------------------getProductById ---------------------------------->
const getProductById = async (req, res) => {
    try {
        const productId = req.params.productId
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: ` '${productId}' this productId is invalid.` })

        //---------checking product available by given product Id ------>
        const existUser = await productModel.findById(productId)
        if (!existUser)
            return res.status(404).send({ status: false, message: `Product does't exits.` })
        if (existUser.isDeleted == true)
            return res.status(400).send({ status: false, message:"this productId is already deleted" })

        res.status(200).send({ status: true, message: `Successful`, data: existUser })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};



//-----------------------------getProducts ------------------------------------->
const getProductByQuery = async (req, res) => {
    try {
        const reqBody = req.query
        let { name, priceGreaterThan, priceLessThan, size, priceSort, ...rest } = reqBody

        if (Object.keys(reqBody).length === 0)
            return res.status(400).send({ status: false, message: `Please enter some data for searching.` })

        if (Object.keys(rest).length > 0)   //if user search  another query which is not avaliable then we will store those query in  ...rest parametrs
            return res.status(400).send({ status: false, message: `You can't search by this key - '${Object.keys(rest)}' ` });

        //----------- Create a Object of Query deatils --------->
        let searchObj = { isDeleted: false }

        if (size) {
            size = size.toUpperCase().split(',').map((item) => item.trim())
            searchObj.availableSizes = { $in: size }
        }

        if (name)
            searchObj.title = { $regex: name.trim() }  //,$options: 'i'

        if (priceGreaterThan)
            searchObj.price = { $gt: priceGreaterThan }

        if (priceLessThan)
            searchObj.price = { $lt: priceLessThan }

        if (priceGreaterThan && priceLessThan)
            searchObj.price = { $gt: priceGreaterThan, $lt: priceLessThan }

        if (priceSort > 1 || priceSort < -1 || priceSort === 0)
            return res.status(400).send({ status: false, message: `Please sort by '1' or '-1'.` })

        //----------- Fetching All Qyuery related data from Product DB & then shorting --------->
        const getProducts = await productModel.find(searchObj).sort({ price: priceSort })
        if (getProducts.length === 0)
            return res.status(404).send({ status: false, message: ` '${Object.values(reqBody)}' plz enter valid deatils this product does't exist.` })

        return res.status(200).send({ status: true, message: `Success`, data: getProducts })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};


//-----------------------------updateProduct ------------------------------------->
const updateProduct = async (req, res) => {
    try {
        let productId = req.params.productId;
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, productImage } = req.body

        if (Object.keys(req.body).length === 0) return res.status(400).send({ status: false, message: "No data found to be updated,please enter data to update" })

        if (!productId) return res.status(400).send({ status: false, message: "Product id is required in path params" })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Product id should be valid mongoose type object Id" })

        const productExist = await productModel.findById({ _id: productId })
        if (!productExist) return res.status(404).send({ status: false, message: "Product details from given product id not found" })

        if (productExist.isDeleted === 'false') return res.status(400).send({ status: false, message: "Product is already deleted" })

        let obj = {}

        if (title) {   //it will check tital when title is given form frontend , otherWise it will not validate title
            if (!isValid(title)) return res.status(400).send({ status: false, message: "Title is required and should be valid" })
            const dupTitle = await productModel.findOne({ title: title })
            if (dupTitle) return res.status(400).send({ status: false, message: "Title is already present in DB" })
            obj.title = title
        }
        if (description) {
            if (!isValid(description)) return res.status(400).send({ status: false, message: "Description is required and should be valid" })
            obj.description = description
        }
        if (price) {
            if (!isValidPrice(price)) return res.status(400).send({ status: false, message: `Price is required and should be a valid price e.g(54,589.23,6726,etc).` })
            obj.price = price
        }
        if (currencyId) {
            if (currencyId !== 'INR') return res.status(400).send({ status: false, message: `NR should be the currency id.` })
            obj.currencyId = currencyId
        }
        if (currencyFormat) {
            if (currencyFormat != 'INR' || currencyFormat != '₹') return res.status(400).send({ status: false, message: "Please enter a valid currency id or currency format i.e 'INR' or '₹'" })
            const symbol = getSymbolFromCurrency('INR')
            obj.currencyFormat = symbol
            console.log(symbol)
        }
        if (isFreeShipping) {
            if (!isBoolean(isFreeShipping)) return res.status(400).send({ status: false, message: "Is free Shipping value should be boolean" })
            obj.isFreeShipping = isFreeShipping
        }
        if (style) {
            if (!isValidString(style)) return res.status(400).send({ status: false, message: "Style should be a valid string" })
            obj.style = style
        }
        if (installments) {
            if (isNaN(Number(installments))) return res.status(400).send({ status: false, message: "Installments should be a valid number" })
            obj.installments = installments
        }

        if (productImage) {
            let file = req.files
            if (!(file && file.length)) return res.status(400).send({ status: false, message: "No file found" })

            let uploadedFileUrl = await uploadFile(file[0])
            obj.productImage = uploadedFileUrl
        }

        if (availableSizes) {
            let sizeArray = availableSizes.toUpperCase().split(',').map((items) => items.trim())
            //console.log(sizeArray)
            for (let i = 0; i < sizeArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XL", "XXL"].includes(sizeArray[i]))) {
                    return res.status(400).send({ status: false, message: `Please enter size from available sizes ["S","XS","M","X","L","XL","XXL"]` })
                }
            }
            obj.availableSizes = sizeArray
        }


        //----------- Fetching All Product Data from Product DB then Update the values --------->
        const updatedPro = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, obj, { new: true })

        return res.status(200).send({ status: true, message: "Product updated successfully!!", data: updatedPro })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};


//--------------------------deleteProduct -------------------------------------------->
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: ` '${productId}' this productId is invalid.` })

        const existProduct = await productModel.findById(productId)
        if (!existProduct)
            return res.status(404).send({ status: false, message: `Product does't exits` })
        if (existProduct.isDeleted === true)
            return res.status(400).send({ status: false, message: ` '${productId}' this productId already deleted.` })

        const deleteData = await productModel.findByIdAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: Date.now() });

        res.status(200).send({ status: true, message: `Successfully deleted.`, data: deleteData })
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};



//--------------- Module Export -----------------//
export { createProduct, getProductByQuery, getProductById, updateProduct, deleteProduct };


