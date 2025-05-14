


const loadOffers = async (req,res) => {
    try {
        return res.render('offers',{
            pageTitle : 'Offers',
            currentPage:'offers',
            currentPages : 1,
            totalPages : 10,
            iconClass : 'fa-gift'
        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load offers',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}


module.exports = {
    loadOffers
}