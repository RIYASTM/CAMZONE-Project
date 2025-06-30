



const loadDashboard = async (req,res) => {
    try {

        if(req.session.admin){

            return res.render('dashboard',{
                currentPage : 'dashboard',
                pageTitle: 'Dashboard',
                iconClass: 'fa-chart-line'
            })
        }

       return res.redirect('/admin/')

    } catch (error) {

        console.log('===========================================')
        console.log('failed to load dashboard page',error)
        console.log('===========================================')
        res.status(500).send("server error")
        
    }
}



module.exports = {
    loadDashboard
}