const User = require('../../model/userModel')

const loadCustomers = async (req, res) => {
    try {
        let search = req.query.search || '';

        if (search) {
            console.log( 'Searched value customer : ' ,search)
        }

        let page = 1
        if(req.query.page){
            page = parseInt(req.query.page)
        }

        const limit = 5;

        const userData = await User.find({ 
            isAdmin : false,
            $or : [
                {name:{$regex: '.*'+search+'.*',$options:"i"}},
                {email:{$regex: '.*'+search+'.*',$options:"i"}}
            ]
        })
        .sort({createdOn : -1})
        .limit(limit * 1)
        .skip((page-1) * limit)
        .exec()

        
        const count = await User.find({
            isAdmin : false,
            $or : [
                {name:{$regex: '.*'+search+'.*'}},
                {email:{$regex: '.*'+search+'.*'}}
            ]
        }).countDocuments()

        const totalPages = Math.ceil((count >= 2 ? count : 1) / limit)

        return res.render('customers',{
            data : userData,
            currentPage : 'Customers',
            iconClass: 'fa-users',
            pageTitle: 'Customers',
            currentPages : page,
            totalPages,
            search
        });
    } catch (error) {
        console.log('======================================');
        console.log('failed to load customers', error);
        console.log('======================================');
        res.status(500).send('Server Error');
    }
};

const customerBlocked = async (req,res) => {

    try {
        
        let id = req.query.id

        await User.updateOne({_id:id},{$set:{isBlocked : true}})

        res.redirect('/admin/customers')

    } catch (error) {

        res.redirect('/page404')
        
    }
}

const unblockCustomer = async (req,res) => {
    try {
        
        let id = req.query.id

        await User.updateOne({_id:id},{$set:{isBlocked : false}})

        res.redirect('/admin/customers')

    } catch (error) {
        
        res.redirect('/page404')

    }
}

module.exports = {
    loadCustomers,
    customerBlocked,
    unblockCustomer
};