

const loadSettings = async (req,res) => {
    try {
        return res.render('settings',{
            pageTitle : 'Settings',
            currentPage:'settings',
            iconClass: 'fa-cog'
        })
    } catch (error) {
        
        console.log('======================================');
        console.log('failed to load settings',error);
        console.log('======================================');
        res.status(500).send("Server Error")
    }
}


module.exports = {

    loadSettings

}