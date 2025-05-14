

const loadCoupon = async (req,res) => {
    try {
        
        const search = req.query.search || ''



        return res.render('coupon',{
            currentPage : 'coupon',
            search
        })

    } catch (error) {
        console.log('Failed to load the coupon page : ',error)
    }
}


module.exports = {
    loadCoupon
}