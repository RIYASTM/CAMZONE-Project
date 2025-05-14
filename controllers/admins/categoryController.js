const { render } = require('ejs')
const Category = require('../../model/categoryModel')
const Products = require('../../model/productModel')

//Helper Function
const {validateCategoryForm} = require('../../helpers/validations')


const loadCategory = async (req,res) => { 
    try {

        const search =  req.query.search  || ''

        if(search){
            console.log('search value category: ',search)
        }

        const page = parseInt(req.query.page) || 1
        const limit = 6
        const skip = (page - 1) * limit

        const categories = await Category.find({
            $or : [
            {name:{$regex: '.*'+search+'.*',$options:"i"}},
            {description:{$regex: '.*'+search+'.*',$options:"i"}}
                ]
            }).sort({createdAt : -1}).skip(skip).limit(limit)

        const totalCategories = await Category.find({$or : [
            {name:{$regex: '.*'+search+'.*',$options:"i"}},
            {description:{$regex: '.*'+search+'.*',$options:"i"}}
                ]}).countDocuments()
        
        const totalPages = Math.ceil((totalCategories >=2 ? totalCategories : 1) / limit)

        return res.render('category',{
                        pageTitle: 'Category',
                        category: categories,
                        search,
                        currentPage:'category',
                        currentPages : page,
                        totalPages : totalPages,
                        iconClass: 'fa-list'
                    })


    } catch (error) {
        
        console.log('======================================');
        console.log('Failed to load category',error);
        console.log('======================================');
        return res.redirect('/page404')
    }
}

const addCategory = async (req,res) => {

    try {
        const { name, description, isListed } = req.body;

        const findCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } }); 

        if (findCategory) {
            return res.status(409).json({ 
                success: false,
                message: "Category already exists!!!",
                errors: { name: "Category already exists!!!" }
            });
        }

        const categoryData = {name, description }

        const errors = validateCategoryForm(categoryData);
        if (errors) {
            console.log("From back : ",errors)
            return res.status(400).json({ success: false, errors });
        }

        const newCategory = new Category({ 
            name: name,
            description: description,
            isListed : isListed
        });

        await newCategory.save();

        console.log('=====================================')
        console.log('Category added : ', newCategory)
        console.log('=====================================')

        return res.status(200).json({
            success: true,
            message: 'Category Added Successfully',
            redirectUrl: '/admin/category' 
        });

    } catch (error) {
        console.error("Category adding error : ", error);
        return res.status(500).json({ 
            success: false,
            message: "Something went wrong while adding category: " + error.message 
        });
    }
}

const editCategory = async (req,res) => {
    try {

        const {id , name , description , categoryOffer , isListed} = req.body

        if(categoryOffer > 100){
            return res.json({success : false , message : "Category offer should be under 101!!"})
        }

        const existCategory = await Category.findOne({name:{ $regex: new RegExp(`^${name}$`, 'i') } })

        if(existCategory && existCategory._id .toString() !== id){
            return res.status(400).json({success : false , message : 'Category already exist with this name'})
        }

        const updateCategory = await Category.findByIdAndUpdate(id,{
            name ,
            description ,
            categoryOffer ,
            isListed 
        },{new:true})

        console.log('=====================================')
        console.log('Edited category : ', updateCategory)
        console.log('=====================================')

        if(!updateCategory){
            res.status(404).json({
                success : false,
                message : 'Category not found'
            })
        }

        res.status(200).json({
            success: true ,
            message:"Category Successfully Updated"
        });

    } catch (error) {

        console.log('Category editing failed : ',error)

        return res.status(500).json({
            success : false ,
            message : 'An error occurred while on editting category!!',
            error : error.message
        })
        
    }
}

const deleteCategory = async (req,res) => {

    const id = req.body.categoryId

    console.log('category Id : ',id)

    const category = await Category.findById(id)

    console.log('=====================================')
    console.log('Deleting category : ',category)
    console.log('=====================================')

    await Category.findByIdAndDelete(id)

   return res.status(200).json({status: true,message:"Category offer removed"})

}

const addCategoryOffer = async (req,res) => {

    try {
    
        const percentage = parseInt(req.body.percentage)

        if(percentage>100){
            return res.json({status : false , message : 'Category offer should be under 101!!'})
        }

        const categoryId = req.body.categoryId
        const category = await Category.findById(categoryId)
        if(!category){
            return res.status(404).json({status : false, message : 'Category not found'})
        }

        const products = await Products.find({category:category._id})
        const hasProductOffer = products.some((product) => product.productOffer > percentage)

        if(hasProductOffer){
            return res.json({status : false , message : "Products within this category already have product offer!!!"})
        }
        await Category.updateOne({_id:categoryId},{$set:{categoryOffer:percentage}})

        for (const product of products){
            product.productOffer = 0
            product.salePrice = product.regularPrice
            await product.save()
        }
            res.status(200).json({status:true})

    } catch (error) {

        res.status(500).json({status: false,message : "Internal server error"})
        console.log("failed to add category offer : ", error)
        
    }
}

const removeCategoryOffer = async (req,res) => {

    try {
        
        const categoryId = req.body.categoryId

        const category = await Category.findById(categoryId)

        if(!category){
            return res.status(404).json({status:false , message :"Category not found"})
        }

        const percentage = category.categoryOffer
        const products = await Products.find({category:category._id})

        if(products.lenght > 0 ){
            for( const product of products){
                product.salePrice +=Math.floor(product.regularPrice * (percentage/100))
                product.productOffer = 0
                await product.save() 
            }
        }

        category.categoryOffer = 0
        await category.save()
            res.status(200).json({status: true,message:"Category offer removed"})


    } catch (error) {

        console.log("failed to remove category offer : ",error)
        return res.status(500).json({status:false, message : "Internal server error"})

        
    }
}

module.exports = {
    loadCategory,
    addCategory,
    editCategory,
    deleteCategory,
    addCategoryOffer,
    removeCategoryOffer
}