require('dotenv').config()
require('./src/db/conn')
const express = require('express')
const app = express()
const DB = process.env.DATABASE
const bcrypt = require('bcryptjs');
const session = require('express-session')
const ejs = require('ejs')
const expressLayout = require('express-ejs-layouts')
const path = require('path')
const User = require('./src/models/userSchema')
const Product = require('./src/models/productSchema')
const flash = require('express-flash')
const port = process.env.PORT || 8000
const MongoDbStore = require('connect-mongo');
const authenticate = require('./middleware/authenticate');

app.use(express.json())
app.use(express.urlencoded({extended : false}))
app.use(express.static('public'))

app.use(session({
    secret : process.env.SECRET_KEY,
    resave: false,
    store: MongoDbStore.create({
        mongoUrl : DB,
        collection: 'sessions'
    }),
    saveUninitialized: false,
    cookie : { maxAge : 1000 * 60 } // 1 mint
}))
app.use(flash())

app.use((req, res, next) => {
    res.locals.session = req.session
    // console.log(res.locals.session);
    next()
})

const viewPath = path.join(__dirname, "/templates/views")
app.use(expressLayout)
app.set('view engine', 'ejs')
app.set('views', viewPath)

app.get('/', async (req, res) => {
        const products = await Product.find()
    res.render('home', {
        products
    })
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/product-register', (req, res) => {
    res.render('productRegister')
})

app.get('/cart', (req, res) =>{
    res.render('cart')
})

app.post('/success-buy', async (req, res) => {

    if(!req.session.product) {
                req.session.product = {
                    items : {},
                    totalQnty : 0,
                    totalPrice : 0
                }
            }
                let product = req.session.product
                // check if item does not exist in product
                if(!product.items[req.body._id]) {
                    product.items[req.body._id] = {
                        item : req.body,
                        qnty : 1
                    }
                    product.totalQnty += 1
                    product.totalPrice += req.body.price
                }else {
                    product.items[req.body._id].qnty += 1
                    product.totalQnty += 1
                    product.totalPrice += req.body.price
                }
            return res.json({ totalQnty : req.session.product.totalQnty })
})

app.get('/products', async (req, res) => {
    const products = await Product.find()
    res.render('products', {
        products
    })
})

app.get('/api/products', async (req, res) => {
    try {
        const product = await Product.find()
        if(product) {
            return res.status(200).json({product})
        }else {
            return res.status(404).json({error : 'No data found....'})
        }
    } catch (e) {
        return res.status(500).json({error : e})
    }
})

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    // console.log(req.body);
    if(!name || !email || !password) {
        return res.status(422).json({ error: "plzz filled the field properly" });
    }
    try {
        const userExist = await User.findOne({ email: email });
        // console.log(userExist);
        if(userExist) {
            return res.status(422).json({ error: "Email already exist!!" });
        }else {
            const user = new User({name, email, password})
            let token = await user.generateAuthToken()
            // console.log(token);
            // console.log(user);
            await user.save();
            res.status(200).render('login');
        }
    } catch (err) {
        return res.status(500).json({error : err})
    }
})

app.post('/login', async (req, res) => {
    try {
        let token;
        const  { email, password, role } = req.body;

        if(!email || !password) {
            return res.status(400).json({error: "Plzz fill the data"});
        }

        const userExist = await User.findOne({ email });
        // console.log(userExist.role);

        if(userExist) {
            const isMatch = await bcrypt.compare(password, userExist.password);

            token = await userExist.generateAuthToken();

            res.cookie('jwtoken', token, {
                expires: new Date(Date.now() + (60 * 1000)), //1 min
                httpOnly: true,
            })

            if(!isMatch) {
                res.status(400).json({error: "Invalid Credientials"});
            }else if(userExist.role == 'seller'){
                const availableProduct = req.session.product
                // console.log(availableProduct);
                if(availableProduct){
                    const id = req.session.product.items.id
                    const allProduct = await Product.find( { _id: { $nin: id } } )
                    // console.log(req.session.product.items.id);
                    res.render('user', {
                        allProduct
                    })
                }else {
                    const allProduct = await Product.find()
                    res.render('user', {
                        allProduct
                    })
                }
                
            }else {
                const products = await Product.find()
                // console.log(typeof(products));
                res.render('home', {
                    products
                })
            }
        }else {
            res.status(400).json({ error: "Invalid Credientials" });
        }
    }catch (err) {
        console.log(err);
    }
})

app.post ('/success', async (req, res) => {
    try {
        const { name, price, image } = req.body
        const product = new Product({name, price, image})
        await product.save()
        res.status(200).render('success')
    } catch (e) {
        res.status(500).json({error : e})
    }
})



app.listen(port, () => {
    console.log(`listening on port : ${port}`);
})