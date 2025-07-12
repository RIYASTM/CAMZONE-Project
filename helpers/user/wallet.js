const Wallet = require('../../model/walletModal');

async function addToWallet(userId, amount, reason){
    try {

        console.log('addto wallet userId : ', userId)
        console.log('addto wallet amount : ', amount)
        console.log('addto wallet reason : ', reason)
        
        // const userId = req.session.user

        let wallet = await Wallet.findById(userId)

        if(!wallet){
            wallet = await Wallet.findOne({userId})
            console.log('wallet not found')
        }
        console.log('user in wallet ')

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
                userId,
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

module.exports = {addToWallet}