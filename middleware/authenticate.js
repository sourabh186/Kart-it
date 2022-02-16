const jwt = require('jsonwebtoken');
const User = require('../src/models/userSchema');

const authenticate = async (req,res,next) => {
        console.log(req.cookies);
    try {
        const token = req.cookies.jwtoken;
        console.log(token);
        const verifyUser = jwt.verify(token, 'MYNAMEISSOURABHSAINIANDNICKNAMEISCHIKUU');
        console.log(verifyUser);

        const register = await User.findOne({_id:verifyUser._id});
        console.log(register);

        req.token = token;
        req.register = register;

        next()
    } catch(err) {
        // res.status(401).send(err);
        // console.log(err);
        if(err) {res.status(500).render('login')};
    }
}

module.exports = authenticate;