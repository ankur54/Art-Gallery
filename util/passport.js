const bcrypt = require('bcryptjs')
const User = require('../model/user')

module.exports = {
    authentication: passport => {
        const localStrategy = require('passport-local').Strategy;
    
        passport.use(new localStrategy({usernameField: 'email'}, 
            (email, password, done) => {
                User.findOne({ email }, (err, data) => {
                    if (err) throw err;
                    if (!data) return done(null, false, { message : 'Email not registered' });
                    
                    bcrypt.compare(password, data.password, (err, match) => {
                        if (err) throw err;
                        if (!match) return done(null, false, { message : 'Password did not match' })
                        else return done(null, data)
                    })
                })
        }))
    
    
        passport.serializeUser((user, cb) => {
            cb(null, user._id);
        });
    
        passport.deserializeUser((id, cb) => {
            User.findById(id, (err, user) => {
                cb(err, user)
            })
        })
    },

    validation: (req, res, next) => {
        console.log(req.isAuthenticated())
        if(req.isAuthenticated()) {
            res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, post-check=0, pre-check=0')
            return next();
        } else {
            console.log('User not is Authenticated')
            res.redirect('/users/login');
        }
    }
}