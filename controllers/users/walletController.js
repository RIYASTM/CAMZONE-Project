const Wallet = require('../../model/walletModal')
const User = require('../../model/userModel')
const Cart = require('../../model/cartModel')

const loadWallet = async (req,res) => {
    try {

        const search = req.query.search || '';
        const userId = req.session.user
        const user = await User.findById(userId)
        const cart = await Cart.findById(userId)

        const userWallet = await Wallet.findOne({userId})

        // console.log('Transaction : ', transactions)
        console.log('User Wallet : ', userWallet)
        
        if(!userWallet){
            return res.render('wallet',{
                user,
                wallet : {balance : 0},
                transactions : [],
                currentPage : 'Wallet',
                cart,
                search,
                curretnPages : 1,
                totalPage : 2
            })
        }

        const transactions = userWallet.transactions || []
        
        return res.render('wallet',{
            currentPage : 'Wallet',
            user,
            search,
            cart,
            wallet : userWallet,
            transactions
        })

    } catch (error) {
        console.log('error on launching wallet page : ', error)
        return res.status(500).render('error', { message: 'Failed to load wallet.' });
    }
} 

async function addToWallet(userId, amount, reason){
    try {
        
        // const userId = req.session.user
        const wallet = await Wallet.findById(userId)

        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const count = await Wallet.countDocuments({
            createdOn: { $gte: today, $lt: tomorrow }
        });

        const seq = (count % 100).toString().padStart(2, '0');
        const transactionID = `TRID${year}${month}${day}${seq}`;

        const transactions = {
                    type : 'Credit',
                    amount : amount,
                    description : reason,
                    transactionId : transactionID,
                    status : 'Success'
                }

        let updatedWallet

        if(!wallet){
            updatedWallet = new Wallet ({
                user : userId,
                transactions : [transactions],
                balance : amount
            })
            
        }else{
            wallet.balance += amount;
            wallet.transactions.push(transactions)
            updatedWallet = wallet
        }

        await updatedWallet.save()

        return { success: true, message: 'Wallet updated successfully', wallet : updatedWallet };

    } catch (error) {
        console.error('Error adding to wallet:', error);
        return { success: false, message: 'Internal server error' };
    }
}

module.exports = {
    loadWallet,
    addToWallet
}