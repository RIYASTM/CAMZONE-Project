const sanitizeHtml = require('sanitize-html');

function validateUser(data) {
    const namepattern = /^[A-Za-z\s]+$/;
    const emailpattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
    const alpha = /[a-zA-Z]/
    const digit = /\d/
    let error = {};

    if (!data.name) {
        error.name = "user name is required!!"
    } else if (!namepattern.test(data.name)) {
        error.name = "Name can only contain Alphabets and spaces!!"
    }

    if (!data.email) {
        error.email = "email is required";
    } else if (!emailpattern.test(data.email)) {
        error.email = "Invalid Format!!"
    }

    if (!data.password) {
        error.password = "password is required"
    } else if (data.password.length < 8) {
        error.password = "Enter minimum 8 charactors!!"
    } else if (!alpha.test(data.password) || !digit.test(data.password)) {
        error.password = "Should contain Numbers and Alphabets"
    }

    if (!data.confirmPassword) {
        error.confirmPassword = "confirmPassword is required!!"
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
    }

    if (!data.categoryDescription) {
        const fieldName = data.categoryDescription !== undefined ? 'categoryDescription' : 'description';
        error.categoryDescription = 'Please enter the description';
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
    }

    if(!data.description){
        error.description = 'Brand description is required!!'
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

    const namepattern = /^[A-Za-z\s]+$/;
    const emailPattern = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,4})+$/;
    const digit = /\d/

    let error = {}

    if(!data.name){
        name.error = 'Name is required!!'
    }else if(!namepattern.test(data.name)){
        name.error = "Name should contains only alphabets!!"
    }
    return Object.keys(error).length > 0 ? error : null;
}

function validateAddress(data){

            const phonePattern = /^\+?\d{1,4}[\s-]?\d{6,14}$/;
            const pincodePattern = /^6[0-9]{5}$/;
            const namePattern = /^[a-zA-Z\s]+$/;
            let errors = {};
    
            if (!data.name || !namePattern.test(data.name)) {
                errors.name = "Valid name is required (letters and spaces only).";
            }
            if (!data.streetAddress) {
                errors.streetAddress = "Street address is required.";
            }
            if (!data.city) {
                errors.city = "Town/City is required.";
            }
            if (!data.state) {
                errors.state = "State is required.";
            }
            if(!data.landMark){
                errors.landMark = "LandMark or Apartmetn is required!"
            }
            if (!data.district) {
                errors.district = "District is required.";
            }
            if (!data.country) {
                errors.country = "Country is required.";
            }
            if (!data.pincode || !pincodePattern.test(data.pincode)) {
                errors.pincode = "Valid pincode is required 6 digits).";
            }
            if (!data.phone || !phonePattern.test(data.phone)) {
                errors.phone = "Valid phone number 1 is required.";
            }
            if (!data.altPhone || !phonePattern.test(data.altPhone)) {
                errors.altPhone = "Valid phone number 2 is required.";
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
    } else if (data.discountType === 'percentage' && (discount <= 0 || discount > 100)) {
        errors.discount = 'Percentage discount must be between 1 and 100';
    }
    const minOrder = parseFloat(data.minOrder);
    if (isNaN(minOrder) || minOrder <= 0) {
        errors.minOrder = 'Minimum order amount is required and must be positive';
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