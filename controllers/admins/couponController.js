


const loadCoupons = async (req,res) => {
    try {
        return res.render('coupons',{
            pageTitle : 'Coupons',
            currentPage:'coupons',
            currentPages : 1,
            totalPages : 10,
            iconClass : 'fa-ticket-alt'
        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load coupons',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}


module.exports = {
    loadCoupons
}