const sanitizeHtml = require('sanitize-html');

function validateUser(data) {
    const namepattern = /^[A-Za-z\s]+$/;
    const emailpattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
    const alpha = /[a-zA-Z]/
    const digit = /\d/
    let error = {};

    if (!data.name) {
        error.name = "User name is required!!"
    } else if (!namepattern.test(data.name)) {
        error.name = "Name can only contain Alphabets and spaces!!"
    } else if(!(/^[A-Za-z]+(?:\s[A-Za-z]+)*$/).test(data.name.trim())){
        error.name = "Name can't allow multiple spaces!!"
    } else if (data.name.trim().length > 15){
        error.name = 'Name is too long!!'
    } else if (data.name.trim().length < 4){
        error.name = 'Name should contains min 4 charectors!!'
    }

    if (!data.email) {
        error.email = "Email is required";
    } else if (!emailpattern.test(data.email)) {
        error.email = "Invalid Format!!"
    }

    if (!data.password) {
        error.password = "Password is required"
    } else if (data.password.length < 8) {
        error.password = "Enter minimum 8 charactors!!"
    } else if (!alpha.test(data.password) || !digit.test(data.password)) {
        error.password = "Should contain Numbers and Alphabets"
    }

    if (!data.confirmPassword) {
        error.confirmPassword = "ConfirmPassword is required!!"
    } else if (data.password !== data.confirmPassword) {
        error.confirmPassword = "Passwords don`t match!!"
    }

    return Object.keys(error).length > 0 ? error : null;

}

function validateForm(email, password) {
    const emailPattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
    let error = {}

    if (!email) {
        error.email = 'Email is required!!'
    } else if (!emailPattern.test(email)) {
        error.email = 'Invalid Email'
    }

    if (!password) {
        error.password = "Password is required!!"
    }

    return Object.keys(error).length > 0 ? error : null
}

function validateCategoryForm(data) {
    const namePattern = /^[a-zA-Z\s]+$/;
    const digit = /^\d+$/;
    let error = {};


    if (!data.categoryName) {
        const fieldName = data.categoryName !== undefined ? 'categoryName' : 'name';
        error.categoryName = 'Please enter the category name';
    } else if (!namePattern.test(data.categoryName)) {
        const fieldName = data.categoryName !== undefined ? 'categoryName' : 'name';
        error.categoryName = 'Name includes only alphabets';
    } else if (data.categoryName.trim().length < 4){
        error.categoryName = 'Name should contains min 4 charectors!!'
    } else if (data.categoryName.trim().length > 10){
        error.categoryName = 'Name is too long!!'
    }

    if (!data.categoryDescription) {
        const fieldName = data.categoryDescription !== undefined ? 'categoryDescription' : 'description';
        error.categoryDescription = 'Please enter the description';
    } else if (data.categoryDescription.trim().length > 50){
        error.categoryDescription = 'Description is too long!!'
    }

    if (data.offerPrice !== 0 && data.offerPrice !== '') {
        if (!digit.test(data.offerPrice)) {
            const fieldName = data.offerPrice !== undefined ? 'offerPrice' : 'categoryOffer';
            error.offerPrice = 'Offer must be a valid number';
        } else if (parseFloat(data.offerPrice) >= 100) {
            const fieldName = data.offerPrice !== undefined ? 'offerPrice' : 'categoryOffer';
            error.offerPrice = 'Offer should be under 100';
        }
    }

    return Object.keys(error).length > 0 ? error : null;
}

function validateProductForm(data) {
    const salePrice = Number(data.salePrice);
    const regularPrice = Number(data.regularPrice);
    const productOffer = Number(data.productOffer);
    const stock = Number(data.stock);

    const errors = {};

    if (!data.productName) {
        errors.productName = 'Name is required!';
    } else if (data.productName.trim().length > 30){
        errors.productName = 'Name is too long!!'
    }else if (data.productName.trim().length < 4){
        errors.productName = 'Name should contain min 4 charecters!!'
    }

    if (!data.description) {
        errors.description = 'Description is required!';
    }

    if (!data.category) {
        errors.category = 'Please select a Category!';
    }

    if (!data.brand) {
        errors.brand = 'Please select a Brand!';
    }

    if (!data.regularPrice) {
        errors.regularPrice = 'Regular Price is required!';
    } else if (isNaN(regularPrice)) {
        errors.regularPrice = 'Regular Price should be numeric!';
    }

    if (!data.salePrice) {
        errors.salePrice = 'Sale Price is required!';
    } else if (isNaN(salePrice)) {
        errors.salePrice = 'Sale Price should be numeric!';
    } else if (salePrice > regularPrice) {
        errors.salePrice = 'Sale Price should be less than Regular Price';
    }

    if (!data.stock) {
        errors.stock = 'Stock is required!';
    } else if (isNaN(stock)) {
        errors.stock = 'Stock should be numeric!';
    }

    if (data.productOffer) {
        if (isNaN(productOffer)) {
            errors.productOffer = 'Offer should be numeric!';
        } else if (productOffer >= 100) {
            errors.productOffer = 'Offer should be under 100!';
        } else if (productOffer < 0) {
            errors.productOffer = 'Negative value not acceptable!';
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

function ValidateBrand(data){
    const namePattern = /^[a-zA-Z\s]+$/
    const digit = /^\d+$/;
    const error= {}

    if(!data.brandName){
        error.brandName = 'Brand name is required!!'
    }else if(!namePattern.test(data.brandName)){
        error.brandName = 'Brand name only included with Alphabets'
    } else if(data.brandName.trim().length < 4){
        error.brandName = 'Brand name should contain min 4 characters!!'
    } else if (data.brandName.trim().length > 10){
        error.brandName = 'Invalid name!!'
    }

    if(!data.description){
        error.description = 'Brand description is required!!'
    } else if(data.description.trim().length > 50){
        error.description = 'Description is too long!!'
    }

    if(data.brandOffer){
        if(!digit.test(data.brandOffer)){
            error.brandOffer = 'Offer should be a number!!'
        }else if(data.brandOffer >= 99){
            error.brandOffer = 'Offer should be under 100 %!!'
        }
    }

    return Object.keys(error).length > 0 ? error : null
}

function validateProfile(data) {

    console.log(data)
    const namepattern = /^[A-Za-z\s]+$/;
    const emailPattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
    const digit = /\d/;
    const phonePattern = /^\[6-9]\d{9}$/;

    let error = {}

    if(!data.name){
        error.name = 'Name is required!!'
    }else if(!namepattern.test(data.name)){
        error.name = "Name should contains only alphabets!!"
    } else if (data.name.trim().length < 4){
        error.name = 'Name should contains 4 characters!!'
    } else if (data.name.trim().length > 15){
        error.name = 'Invalid Name'
    }
    if(data.email){
        if(!emailPattern.test(data.email)){
            error.email = 'Invalid Email!!'
        }
    }
    if(data.phone){
        if(!phonePattern.test(data.phone)){
            error.phone = 'Invalid Phone Number!!'
        }
    }
    return Object.keys(error).length > 0 ? error : null;
}

function validateAddress(data){

    console.log("phone 1 : ",data.phone)
    console.log("altPhone : ", data.altPhone)
            const phonePattern = {
                'USA' : /^\+1[2-9]\d{2}[2-9]\d{6}$/,
                'India' : /^\+91[6-9]\d{9}$/,
                'UK' : /^\+44\d{10}$/,
                'UAE' : /^\+971\d{8,9}$/,
                'KSA' : /^\+966\d{8,9}$/
            };
            const pincodePattern = {
                'India': /^\d{6}$/,
                'USA': /^\d{5}$/,
                'UK': /^[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}$/,
                'UAE' : /^\d{3,6}$/,
                'SAUDI ARABIA' : /^[1-8]\d{4}$/,
                'KSA' : /^[1-8]\d{4}$/
            };
            const namePattern = /^[a-zA-Z\s]+$/;
            let errors = {};
    
            if (!data.name || !namePattern.test(data.name)) {
                errors.name = "Valid name is required (letters and spaces only).";
            } else if(data.name.trim().length < 4){
                errors.name = 'Name should contains min 4 characters!!'
            } else if (data.name.trim().length > 15){
                errors.name = 'Invalid Name!!'
            }
            if (!data.streetAddress) {
                errors.streetAddress = "Street address is required.";
            } else if (data.streetAddress.trim().length > 30){
                errors.streetAddress = 'Invalid entry!!'
            }
            if (!data.city) {
                errors.city = "Town/City is required.";
            } else if (data.city.trim().length > 15){
                errors.city = 'Invalid city'
            }
            if (!data.state) {
                errors.state = "State is required.";
            }
            if(!data.landMark){
                errors.landMark = "LandMark or Apartmetn is required!"
            } else if (data.landMark.trim().length > 25){
                errors.landMark = 'Invalid landmard'
            }
            if (!data.district) {
                errors.district = "District is required.";
            } else if (data.district.trim().length > 15){
                errors.district = 'District caracters should under 15'
            }
            if (!data.country) {
                errors.country = "Country is required.";
            }

            if (!data.pincode) {
                errors.pincode = "Pincode is required!";
            } else if (data.country && pincodePattern[data.country]) {
                if (!pincodePattern[data.country].test(data.pincode)) {
                    errors.pincode = `Invalid pincode format for ${data.country}!`;
                }
            } else {
                errors.pincode = "Pincode format not supported for this country!";
            }

            // Phone
            if (data.phone) {
                if (data.country && phonePattern[data.country]) {
                    if (!phonePattern[data.country].test(data.phone)) {
                        errors.phone = "Invalid phone number format!";
                    }
                } else {
                    errors.phone = "Unsupported country for phone validation!";
                }
            } else {
                errors.phone = "Phone number 1 is required!";
            }

            // Alternate Phone
            if (data.altPhone) {
                if (data.country && phonePattern[data.country]) {
                    if (!phonePattern[data.country].test(data.altPhone)) {
                        errors.altPhone = "Invalid phone number format!";
                    }
                } else {
                    errors.altPhone = "Unsupported country for phone validation!";
                }
            } else {
                errors.altPhone = "Phone number 2 is required!";
            }

            return Object.keys(errors).length > 0 ? errors : null;
}

function validatePassword(data) {
    const alpha = /[a-zA-Z]/
    const digit = /\d/
    let error = {};

    if(!data.newPassword){
        error.newPassword = 'New password is required!'
    }else if ( data.newPassword.length < 8){
        error.newPassword = 'Enter minimum 8 Charactors!!'
    }else if (!alpha.test(data.newPassword) || !digit.test(data.newPassword)){
        error.password = 'Passwords should contains Numbers and Alphabets!!'
    }

    if (!data.confirmPassword) {
        error.confirmPassword = "confirmPassword is required!!"
    } else if (data.newPassword !== data.confirmPassword) {
        error.confirmPassword = "Passwords don`t match!!"
    }

    return Object.keys(error).length > 0 ? error : null;

}

const validateCoupon = (data) => {
    const errors = {};

    if (!data.couponName || typeof data.couponName !== 'string' || !/^[a-zA-Z\s]+$/.test(data.couponName.trim())) {
        errors.couponName = 'Coupon name is required and must contain only letters and spaces';
    } else if (data.couponName.trim().length < 5 ){
        errors.couponName = 'Coupon name should have minimum 5 Characters!!'
    } else if (data.couponName.trim().length > 15) {
        errors.couponName = 'Coupon name should not have 15 above characters!!'
    }
    if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
        errors.description = 'Description is required';
    }
    if (!data.discountType || !['percentage', 'fixed'].includes(data.discountType)) {
        errors.discountType = 'Discount type must be either "percentage" or "fixed"';
    }
    const discount = parseFloat(data.discount);
    if (isNaN(discount) || discount <= 0) {
        errors.discount = 'Discount is required and must be a positive number';
    } else if(discount > 60000) {
        errors.discount = 'Discount should under 60,000!!'
    } else if (data.discountType === 'percentage' && discount > 80) {
        errors.discount = 'Percentage discount must be between 1 and 80';
    }
    const minOrder = parseFloat(data.minOrder);
    if (isNaN(minOrder) || minOrder <= 0) {
        errors.minOrder = 'Minimum order amount is required and must be positive';
    } else if (data.minOrder && data.discountType === 'fixed'){
        const minAmount = discount + (discount * 0.2)
        if(minOrder < minAmount)
        errors.minOrder = `Minimum order should be ${minAmount} or above!!`
    }

    const validFrom = new Date(data.validFrom);
    const validUpto = new Date(data.validUpto);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(validFrom.getTime())) {
        errors.validFrom = 'Valid from date is required and must be a valid date';
    } else if (validFrom < today) {
        errors.validFrom = `Valid from date shouldn't be earlier than today`;
    }
    if (isNaN(validUpto.getTime())) {
        errors.validUpto = 'Valid upto date is required and must be a valid date';
    } else if (validUpto <= validFrom) {
        errors.validUpto = 'Valid upto date must be after valid from date';
    }
    if (data.couponLimit && (isNaN(parseInt(data.couponLimit)) || parseInt(data.couponLimit) < 0)) {
        errors.couponLimit = 'Usage limit must be a non-negative number';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};






module.exports = {
    validateForm,
    validateUser,
    validateCategoryForm,
    validateProductForm,
    validateProfile,
    validateAddress,
    validatePassword,
    ValidateBrand,
    validateCoupon
}