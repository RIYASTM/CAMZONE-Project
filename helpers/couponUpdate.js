const Coupon = require("../model/couponModel");


const couponUpdate = async (coupon) => {
    coupon.couponLimit = Math.max(0, coupon.couponLimit - 1);
    if(coupon.couponLimit === 0 ){
        coupon.status = 'Unavailable'
    }
    await coupon.save()
}

module.exports = {
    couponUpdate
}