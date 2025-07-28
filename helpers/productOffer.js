

function calculateDiscountedPrice(product) {
    const productOffer = product.productOffer || 0;
    const categoryOffer = product.category?.categoryOffer || 0;
    const brandOffer = product.brand?.brandOffer || 0;

    const offer = categoryOffer + brandOffer
    const discountedPrice = Math.round(product.regularPrice * (1 - offer / 100));
    
    const totalOffer = productOffer + categoryOffer + brandOffer;

    return { discountedPrice, totalOffer };
}

module.exports = {
    calculateDiscountedPrice
}