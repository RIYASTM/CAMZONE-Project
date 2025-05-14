



const loadDashboard = async (req,res) => {
    try {

        if(req.session.user){

            return res.render('dashboard',{
                currentPage : 'dashboard',
                pageTitle: 'Dashboard',
                iconClass: 'fa-chart-line'
            })
        }

        res.redirect('/admin/')

    } catch (error) {

        console.log('===========================================')
        console.log('failed to load the page',error)
        console.log('===========================================')
        res.status(500).send("server error")
        
    }
}



module.exports = {
    loadDashboard
}