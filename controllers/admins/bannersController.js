

const loadBanners = async (req,res) => {
    try {
        return res.render('banners',{
            pageTitle : 'Banners',
            currentPage:'banners',
            currentPages : 1,
            totalPages : 10,
            iconClass : 'fa-image'

        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load banners',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}

module.exports = {
    loadBanners
}