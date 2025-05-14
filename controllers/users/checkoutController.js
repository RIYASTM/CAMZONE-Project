

const loadCheckout = async (req,res) => {
    try {
     
        return res.render('checkout')

    } catch (error) {
        console.log(('Failed to load the checkout page : ', error))
    }
    
}



module.exports = {
    loadCheckout
}