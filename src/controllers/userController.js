//------------------- Importing Module and Packages ------------------------>
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import uploadFile from "../utility/aws-S3_.js";
import userModel from '../models/userModel.js';
import { isValidName, isValidEmail, isValidFile, isValidNumber, isValidPass, isValidTxt, isValidPin, isValidObjectId } from '../utility/validator.js';


//-------------------------createUser------------------------------------------->
const createUser = async (req, res) => {
    try {
        const reqBody = req.body;
        const file = req.files;
        //-------- Destructuring User Deatils formBody Data ---------->
        const { fname, lname, email, phone, password, address } = reqBody;

        //--------- Checking User Body Data ------------------>
        if ((Object.keys(reqBody).length === 0 || reqBody.profileImage !== undefined) && (file.length === 0 || file[0].fieldname !== 'profileImage' || file === undefined))
            return res.status(400).send({ status: false, message: `Please provide  user details` })

        //-------------- Validation of Data -------------------->
        if (!fname)
            return res.status(400).send({ status: false, message: `fname is required.` });

        if (!isValidName(fname))
            return res.status(400).send({ status: false, message: ` '${fname}' this fname is not valid.` });

        if (!lname)
            return res.status(400).send({ status: false, message: `lname is required.` });

        if (!isValidName(lname))
            return res.status(400).send({ status: false, message: ` '${lname}' this lname is not valid.` });

        if (!email)
            return res.status(400).send({ status: false, message: `email is required.` });

        if (!isValidEmail(email))
            return res.status(400).send({ status: false, message: ` '${email}' this email is not valid email.` });

        if (!phone)
            return res.status(400).send({ status: false, message: `phone is required.` });

        if (!isValidNumber(phone))
            return res.status(400).send({ status: false, message: ` '${phone}' this is not valid indian phone number.` });

        if (!password)
            return res.status(400).send({ status: false, message: `password is required.` });

        if (!isValidPass(password))
            return res.status(400).send({ status: false, message: `Use this combination 8-15 char & use 0-9,A-Z,a-z & special char.` });

        //*--------------------address validation---------------------->
        if (!address)
            return res.status(400).send({ status: false, message: `address is required.` });

        //---------------- Convert from JSON String to JSON Object of Address ------------>
        reqBody.address = JSON.parse(address)    // as-`{"shipping":  {"street":"Baker","pincode":"110110"},"billing":{"street":"22BakerSt","pincode":"110110"}}`

        //----------- Destructuring Address from Object Data ------------->
        const { shipping, billing } = reqBody.address;


        //*--------------------------shipping validation--------------------------->
        if (!shipping)
            return res.status(400).send({ status: false, message: `shipping is required.` })

        //-------------------------------street validation--------------------------------->
        if (!shipping.street)
            return res.status(400).send({ status: false, message: `street is required in shipping.` })
        if (!isValidTxt(shipping.street))
            return res.status(400).send({ status: false, message: ` '${shipping.street}' this street is not valid in shipping.` })

        //--------------------------------city validation--------------------------------->
        if (!shipping.city)
            return res.status(400).send({ status: false, message: `city is required in shipping.` }); isValidPin
        if (!isValidTxt(shipping.city))
            return res.status(400).send({ status: false, message: ` '${shipping.city}' this city is not valid in shipping.` })

        //-------------------------------pincode validation--------------------------------->
        if (!shipping.pincode)
            return res.status(400).send({ status: false, message: `pincode is required in shipping.` });
        if (!isValidPin(shipping.pincode))
            return res.status(400).send({ status: false, message: ` '${shipping.pincode}' this pincode is not valid in shipping.` })

        //*-------------------------billing validation---------------------------->
        if (!billing)
            return res.status(400).send({ status: false, message: `billing is required.` })

        //-------------------------------street validation--------------------------------->
        if (!billing.street)
            return res.status(400).send({ status: false, message: `street is required in billing.` })
        if (!isValidTxt(billing.street))
            return res.status(400).send({ status: false, message: ` '${billing.street}' this street is not valid in billing.` })

        //-------------------------------city validation--------------------------------->
        if (!billing.city)
            return res.status(400).send({ status: false, message: `city is required in billing.` }); isValidPin
        if (!isValidTxt(billing.city))
            return res.status(400).send({ status: false, message: ` '${billing.city}' this city is not valid in billing.` })

        //-------------------------------pincode validation--------------------------------->
        if (!billing.pincode)
            return res.status(400).send({ status: false, message: `pincode is required in billing.` });
        if (!isValidPin(billing.pincode))
            return res.status(400).send({ status: false, message: ` '${billing.pincode}' this pincode is not valid in billing.` })


        //-------- Fetching data of Email from DB and Checking Duplicate Email or Phone is Present or Not ---->
        const duplicateEmailAndPhone = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] })
        if (duplicateEmailAndPhone) {
            if (duplicateEmailAndPhone.email == email) { return res.status(400).send({ status: false, message: `This EmailId: ${email} is already exist!` }) }
            if (duplicateEmailAndPhone.phone == phone) { return res.status(400).send({ status: false, message: `This Phone No.: ${phone} is already exist!` }) }
        }


        //--------- Checking the File is present or not and Create S3 Link by uploading in aws -------->
        if (file === undefined || !file.length)
            return res.status(400).send({ status: false, message: `Please provide file details` })

        if (!isValidFile(file[0].originalname))
            return res.status(400).send({ status: false, message: `Enter formate jpeg/jpg/png only.` })

        //------------------aws file uploading------------------->
        const uploadedFileUrl = await uploadFile(file[0]);

        //----------after getting link repalcing frontend img by link---------->
        reqBody.profileImage = uploadedFileUrl

        //------------------- Encrept the password by thye help of Bcrypt (password hashing)------------------->
        const hashPassword = await bcrypt.hash(password, 10);
        reqBody['password'] = hashPassword


        //------------ Final Creation of User -------------->
        const saveUser = await userModel.create(reqBody);
        res.status(201).send({ status: true, message: `User created successfully!!`, data: saveUser });
    } catch (err) {
        res.status(500).send({ status: false, message: err });
    }
};


//-----------------------login ------------------------------------->
const login = async (req, res) => {
    try {
        const reqBody = req.body;
        const { email, password } = reqBody;

        if (Object.keys(reqBody).length === 0)
            return res.status(400).send({ status: false, message: `Please fill the data.` })

        if (!email)
            return res.status(400).send({ status: false, message: `email is required.` });

        if (!isValidEmail(email))
            return res.status(400).send({ status: false, message: ` '${email}' this email is not valid.` });

        if (!password)
            return res.status(400).send({ status: false, message: `Password is required.` });

        if (!isValidPass(password))
            return res.status(400).send({ status: false, message: `Password should be 8-15 char & use 0-9,A-Z,a-z & special char this combination.` });

        //--------------------------------exitsUser----------------------------------->
        const existUser = await userModel.findOne({ email });
        if (!existUser) return res.status(404).send({ status: false, message: 'Please register first.' });

        // ---------------------------decoding hash password--------------------------->
        const matchPass = await bcrypt.compare(password, existUser.password);
        if (!matchPass) return res.status(401).send({ status: false, message: 'Password is wrong.' })

        // ------------------------------token generation----------------------------->
        const payload = {
            userId: existUser._id, Batch: 'Plutonium',
            Project: "Products Management", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24  //expires in 24 hr   we can also write-  5m ,1hr, 24hr, 1d
        };
        const token = jwt.sign(payload, 'group1');

        // --------------------------------response-------------------------------------->
        return res.status(200).send({ status: true, message: 'Login Successful.', data: { userId: existUser._id, token: token } });
    } catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
};


//----------------------------gateUser------------------------------------>
const gateUser = async (req, res) => {  //?
    try {
        const userId = req.params.userId;

        if (!userId)
            return res.status(400).send({ status: false, message: `userId is required.` });

        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: ` '${userId}' this userId is not valid.` });

        const existUser = await userModel.findById(userId)
        if (!existUser)
            return res.status(400).send({ status: false, message: `userId could not found through '${userId}' this userId.` });

        res.status(200).send({ status: true, message: `Success`, data: existUser });
    }
    catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};


//--------------------------- updateUser ------------------------------------------>
const updateUser = async (req, res) => {
    try {
        const reqBody = req.body
        const userId = req.params.userId
        const file = req.files
        //--------------Destructuring User Body Data ---------------->
        let { fname, lname, email, phone, address, password } = reqBody;

        let updatedUser = {}

        //------------ Checking User input is Present or Not ----------->
        const data = Object.keys(reqBody).length;

        if (!data) {
            if (!file)
                return res.status(400).send({ status: false, message: `Enter data for update.` })
        }

        //-----------------------------data validation---------------------------------->
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: `Enter valid UserId.` })

        if (fname) {
            if (!isValidName(fname))
                return res.status(400).send({ status: false, message: ` '${fname}' this fname is not valid.` });
            updatedUser['fname'] = fname
        }
        if (lname) {
            if (!isValidName(lname))
                return res.status(400).send({ status: false, message: ` '${lname}' this lname is not valid.` });
            updatedUser['lname'] = lname
        }
        if (email) {
            if (!isValidEmail(email))
                return res.status(400).send({ status: false, message: ` '${email}' this email is not valid.` });
        }
        if (phone) {
            if (!isValidNumber(phone))
                return res.status(400).send({ status: false, message: ` '${phone}' this phone is not valid.` });
        }
        if (password) {
            if (!isValidPass(password))
                return res.status(400).send({ status: false, message: `Use this combination 8-15 char & use 0-9,A-Z,a-z & special char.` });
        }
        if (file.length > 0) {
            if (!isValidFile(file[0].originalname))
                return res.status(400).send({ status: false, message: `Enter formate jpeg/jpg/png only.` })
            if (file.length > 1)
                return res.status(400).send({ status: false, message: `Only one File Allowed.` })
        }

        //*-------------------address validation-------------------->
        if (address) {
            address = JSON.parse(address)
            const { shipping, billing } = address;

            //*-------------------------shipping validation--------------------------->
            if ('shipping' in address) {
                if (Object.keys(shipping).length === 0)
                    return res.status(400).send({ status: false, message: `Please enter shipping data.` })

                const { street, city, pincode } = shipping;
                if ('street' in shipping) {
                    if (!isValidTxt(street))
                        return res.status(400).send({ status: false, message: ` '${street}' this street is not valid in shipping.` })
                    updatedUser.address.shipping['street'] = street;
                }
                if ('city' in shipping) {
                    if (!isValidTxt(city))
                        return res.status(400).send({ status: false, message: ` '${city}' this city is not valid in shipping.` })
                    updatedUser.address.shipping['city'] = city;
                }
                if ('pincode' in shipping) {
                    if (!isValidPin(pincode))
                        return res.status(400).send({ status: false, message: ` '${pincode}' this pincode is not valid in shipping.` })
                    updatedUser.address.shipping['pincode'] = pincode;
                }
            }


            //*-------------------------billing validation--------------------------->
            if ('billing' in address) {
                if (Object.keys(billing).length === 0)
                    return res.status(400).send({ status: false, message: `Please enter billing data.` })

                const { street, city, pincode } = billing;
                if ('street' in billing) {
                    if (!isValidTxt(street))
                        return res.status(400).send({ status: false, message: ` '${street}' this street is not valid in billing.` })
                    updatedUser.address.billing['street'] = street;
                }
                if ('city' in billing) {
                    if (!isValidTxt(city))
                        return res.status(400).send({ status: false, message: ` '${city}' this city is not valid in billing.` })
                    updatedUser.address.billing['city'] = city;
                }
                if ('pincode' in billing) {
                    if (!isValidPin(pincode))
                        return res.status(400).send({ status: false, message: ` '${pincode}' this pincode is not valid in billing.` })
                    updatedUser.address.billing['pincode'] = pincode;
                }
            }
        }

        //------finding user---------
        const existUser = await userModel.findById(userId)
        if (!existUser)
            return res.status(404).send({ status: false, message: `No user found by '${userId}' this userId..` })

        if (email) {
            if (existUser.email === email)
                return res.status(400).send({ status: false, message: `Please enter different email.` });
            updatedUser['email'] = email
        }

        //------------------------------update----------------------------------->
        if (phone) {
            if (existUser.phone === phone)
                return res.status(400).send({ status: false, message: `Please enter different phone.` });
            updatedUser['phone'] = phone
        }
        if (password) {
            const matchPass = await bcrypt.compare(password, existUser.password);
            if (matchPass === true)
                return res.status(400).send({ status: false, message: `Please enter new password.` });

            const hashPassword = await bcrypt.hash(password, 10);
            updatedUser['password'] = hashPassword;
        }

        //------------- Checking the File is present or not and Create S3 Link ------------>
        if (file.length && file[0].fieldname !== 'profileImage')
            return res.status(400).send({ status: false, message: `Select file for update.` })

        if (file.length > 0) {
            const uploadedFileUrl = await uploadFile(file[0]);
            updatedUser['profileImage'] = uploadedFileUrl
        }

        //----------------------final updation perform in DB------------------------>
        const newData = await userModel.findOneAndUpdate({ _id: userId }, updatedUser, { new: true })
        return res.status(200).send({ status: true, message: `Success`, data: newData })
    }
    catch (err) {
        return res.status(500).send({ status: false, error: err.message });
    }
};



export { createUser, login, gateUser, updateUser };



