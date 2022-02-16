require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email : {
        type : String,
        required : true,
        unique : true
    },
    password: {
        type : String,
        required : true
    },role : {
        type : String,
        default : 'customer'
    },
    date : {
        type: Date,
        default: Date.now
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
}, {timestamps : true})

// password hashing...

userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
})


// generating tokens....

userSchema.methods.generateAuthToken = async function () {
    try {
        let token = jwt.sign({_id : this._id.toString()}, process.env.SECRET_KEY)
        // console.log(token);
        this.tokens = this.tokens.concat({ token : token })
        await this.save()
        return token;
    } catch (e) {
        console.log(err);
    }
}

const User = new mongoose.model('User', userSchema)
module.exports = User;