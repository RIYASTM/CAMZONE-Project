const Wallet = require('../model/walletModal');

async function addToWallet(userId, amount, reason){
    try {

        const wallet = await Wallet.findOne({userId})

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

async function fromWallet(userId, amount, reason){

    const wallet = await Wallet.findOne({userId})

    if(!wallet){
        return {success : false, message : 'Your wallet is not created!!'}
    }
    
    const balance = wallet.balance || ''

    
    console.log("amount : ", amount)
    console.log('wallet amount : ', balance)
    
    if(!wallet || balance < amount || !balance){
        return {success : false, message : 'Insufficient balance in your wallet!!'}
    }


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
                type : 'Debit',
                amount : amount,
                description : reason,
                transactionId : transactionID,
                status : 'Success'
            }

    let updatedWallet

    wallet.balance -= amount;
    wallet.transactions.push(transactions)
    updatedWallet = wallet

    await updatedWallet.save()

    return { success: true, message: 'Wallet updated successfully', wallet : updatedWallet };
}

module.exports = {
    addToWallet,
    fromWallet
}