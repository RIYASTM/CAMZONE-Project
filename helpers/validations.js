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

    const nameField = data.categoryName || data.name;
    const descriptionField = data.categoryDescription || data.description;
    const offerField = (data.offerPrice || data.categoryOffer) ?? 0;

    if (!nameField) {
        const fieldName = data.categoryName !== undefined ? 'categoryName' : 'name';
        error[fieldName] = 'Please enter the category name';
    } else if (!namePattern.test(nameField)) {
        const fieldName = data.categoryName !== undefined ? 'categoryName' : 'name';
        error[fieldName] = 'Name includes only alphabets';
    }

    if (!descriptionField) {
        const fieldName = data.categoryDescription !== undefined ? 'categoryDescription' : 'description';
        error[fieldName] = 'Please enter the description';
    }

    if (offerField !== 0 && offerField !== '') {
        const offerStr = offerField.toString();
        if (!digit.test(offerStr)) {
            const fieldName = data.offerPrice !== undefined ? 'offerPrice' : 'categoryOffer';
            error[fieldName] = 'Offer must be a valid number';
        } else if (parseFloat(offerField) >= 100) {
            const fieldName = data.offerPrice !== undefined ? 'offerPrice' : 'categoryOffer';
            error[fieldName] = 'Offer should be under 100';
        }
    }

    return Object.keys(error).length > 0 ? error : null;
}

function validateProductForm (data) {

    const salePrice = Number(data.salePrice)
    const regularPrice = Number(data.regularPrice)
    const productOffer = Number(data.productOffer)
    const stock = Number(data.stock)

    const errors = {};
    const digit = /\d/;

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

    if (!regularPrice) {
        errors.regularPrice = 'Regular Price is required!';
    } else if (!digit.test(regularPrice)) {
        errors.regularPrice = 'Regular Price should be numeric!';
    }

    if (!salePrice) {
        errors.salePrice = 'Sale Price is required!';
    } else if (!digit.test(salePrice)) {
        errors.salePrice = 'Sale Price should be numeric!';
    } else if(salePrice > regularPrice){
        errors.salePrice = 'Sale Price should be lessthan Regultar Price'
    }

    if (!stock) {
        errors.stock = 'Stock is required!';
    } else if (!digit.test(stock)) {
        errors.stock = 'Stock should be numeric!';
    }

    if (productOffer) {
        if (productOffer >= 100) {
            errors.productOffer = 'Offer should be under 100!';
        } else if (productOffer < 0) {
            errors.productOffer = 'Negative value not acceptable!';
        } else if (!digit.test(productOffer)) {
            errors.productOffer = 'Offer should be numeric!';
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

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






module.exports = {
    validateForm,
    validateUser,
    validateCategoryForm,
    validateProductForm,
    validateProfile,
    validateAddress,
    validatePassword
}