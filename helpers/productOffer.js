

function calculateDiscountedPrice(product) {
    const productOffer = product.productOffer || 0;
    let categoryOffer = product.category?.categoryOffer || 0;
    let brandOffer = product.brand?.brandOffer || 0;

    const totalOffer = productOffer > categoryOffer ? productOffer : (categoryOffer > brandOffer ? brandOffer : categoryOffer);
    const discountedPrice = Math.round(product.regularPrice * (1 - totalOffer / 100));
    
    return { discountedPrice, totalOffer };
}

module.exports = {
    calculateDiscountedPrice
}