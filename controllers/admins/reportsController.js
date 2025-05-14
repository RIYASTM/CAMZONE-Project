


const loadReports = async (req,res) => {
    try {
        return res.render('reports',{
            pageTitle : 'Reports',
            currentPage:'reports',
            currentPages : 1,
            totalPages : 10,
            iconClass : 'fa-chart-bar'
        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load reports',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}

module.exports = {
    loadReports
}