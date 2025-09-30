const Razorpay = require('razorpay')


const razorpayInst = new Razorpay({
    key_id : process.env.RAZORPAY_KEY_ID,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})

async function generateRazorpay( amount){
    try {
        const options = {
            amount : amount * 100,
            currency : 'INR',
            receipt: `Order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        }
        
        const order = await razorpayInst.orders.create(options)

        return order
    } catch (error) {
        console.log('Something went wrong with razorpay : ', error)   
    }

};

async function generateRazorpayCheckout(amount){
    try {
        
        const options = {
            amount : amount * 100,
            currency : 'INR',
            receipt: `Order_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        }
        
        const order = await razorpayInst.orders.create(options)
        order.status = 'Payment Failed'
        order.razorpayStatus = 'Failed'
        return order
    } catch (error) {
        console.log('Something went wrong with razorpay : ', error)   
    }

};


module.exports = {
    razorpayInst,
    generateRazorpay,
    generateRazorpayCheckout
}