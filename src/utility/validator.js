import mongoose from 'mongoose';


const isValidName = (name) => {
    if ((typeof name == 'string' && name.trim().length != 0 && name.match(/^[A-Z a-z]{2,}$/)))
        return true
    return false
};

const isValidEmail = (email) => {
    const regex = /^([a-zA-Z0-9_.]+@[a-z]+\.[a-z]{2,3})?$/.test(email)
    return regex
};

const isValidFile = (img) => {
    const regex = /(\/*\.(?:png|gif|webp|jpeg|jpg))/.test(img)
    return regex
}

const isValidPass = (password) => {
    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/.test(password)
    return regex
};

const isValidNumber = (phone) => {
    let regex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(phone)
    return regex
};

const isValidTxt = (txt) => {
    const regex = /^(?=.*[A-Za-z]+)[A-Za-z\s0-9]{2,}$/.test(txt)
    return regex
}

const isValidPin = (pin) => {
    let regex = /^[1-9]{1}[0-9]{5}$/.test(pin)
    return regex
};

const isValidObjectId = (objectId) => {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const isValid = (value) => {
    if (!value) return false
    if (typeof value === "undefined" || typeof value === "null" || typeof value === "number") return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const isValidPrice = (value) => {
    if (!value) return false
    return /^[1-9]\d{0,7}(?:\.\d{1,4})?$/.test(value)
}

const isBoolean = (value) => {
    if (value == "true" || value == "false") { return true }
    return false
}

const isValidString = (value) => {
    if (typeof value === "undefined" || typeof value === "null" || typeof value === "number") return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const isValidIncludes = function (value, requestBody) {
    return Object.keys(requestBody).includes(value)
}

const isValidNum = function (value) { 
    return /^[0-9]*[1-9]+$|^[1-9]+[0-9]*$/.test(value)
}



export { isValidName, isValidEmail, isValidFile, isValidPass, isValidNumber, isValidTxt, isValidPin, isValidObjectId, isValid, isValidPrice, isBoolean, isValidString, isValidIncludes,isValidNum };
