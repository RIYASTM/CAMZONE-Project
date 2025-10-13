const Products = require('../model/productModel');
const Coupon = require('../model/couponModel')

async function cartPrices(cart) {
    let cartItems = cart.items.filter(item => !item.isDeleted);
    let subTotal = 0;

    for (let item of cartItems) {
        const product = await Products.findOne({ _id: item.productId, isBlocked: false })
            .populate('category')
            .populate('brand');

        if (product) {
            if (item.quantity >= product.quantity) {
                item.quantity = product.quantity;
                cart.markModified('items');
            }

            if (product.stock <= 0) {
                item.isDeleted = true;
                cart.markModified('items');
                continue;
            }

            item.productId = product;

            const { discountedPrice, totalOffer } = calculateDiscountedPrice(product);

            item.itemPrice = product.regularPrice;
            item.discount = totalOffer;
            item.price = discountedPrice;
            item.totalPrice = discountedPrice * item.quantity;
            item.productGst = product.gst || Math.round(product.regularPrice * 0.18);

            subTotal += item.totalPrice;
        } else {
            item.productId = null;
        }
    }

    cartItems = cartItems.filter(item => item.productId !== null);

    cart.totalAmount = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    cart.GST = (cart.totalAmount * 18) / 118;

    await cart.save();

    const totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);
    const totalOfferedPrice = totalOfferPrice - cart.totalAmount;

    return {
        cartItems,
        subTotal,
        totalOfferPrice,
        totalOfferedPrice,
        cartTotal: cart.totalAmount
    }
}

function calculateDiscountedPrice(product) {
    const productOffer = product.productOffer || 0;
    const categoryOffer = product.category?.categoryOffer || 0;
    const brandOffer = product.brand?.brandOffer || 0;

    const totalOffer = Math.max(productOffer, categoryOffer, brandOffer);
    const discountedPrice = Math.round(product.regularPrice * (1 - totalOffer / 100));

    return { discountedPrice, totalOffer };
}

async function calculateAmounts(couponCode, totalAmount, cartItems) {

    const coupon = await Coupon.findOne({ couponCode }) || null;

    let couponDiscount = 0;

    if (coupon) {
        if (coupon.discountType === 'percentage') {
            couponDiscount = Math.floor((totalAmount * coupon.discount) / 100);
        } else {
            couponDiscount = coupon.discount;
        }
    }

    let message = null

    if (totalAmount < couponDiscount) {
        return message = { success: false, message: 'Your order total is below coupon Discount' };
    }

    const finalAmount = Math.floor(totalAmount - couponDiscount);

    const totalGST = Math.floor((finalAmount * 18) / 118);
    const priceWithoutGST = Math.floor(finalAmount - totalGST);



    const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    console.log('totalAmount : ', totalAmount)
    console.log('subTotal : ', subtotal);

    const totalOfferPrice = cartItems.reduce((total, item) => total + (item.itemPrice * item.quantity), 0);

    const totalOfferedPrice = (totalOfferPrice - subtotal) + couponDiscount;

    return {
        message,
        success: true,
        couponDiscount,
        priceWithoutGST,
        totalOfferedPrice,
        finalAmount,
        totalGST,
        coupon
    };
}


module.exports = {
    cartPrices,
    calculateDiscountedPrice,
    calculateAmounts
};
