const express = require('express')
const bcrypt = require('bcryptjs')
const bodyparser = require('body-parser')
const passport = require('passport')
const session = require('express-session')
const cookieparser = require('cookie-parser')
const flash = require('connect-flash')
const mysql = require('mysql')


const router = express.Router()
const db = require('../util/connection')
const admin_db = db.mysql_admin(mysql)

const Event = require('../model/event')
const User = require('../model/user')
const authMiddleware = require('../util/passport')
const queryString = require('../util/sql_query')


router.use(bodyparser.urlencoded({ extended: true }))

router.use(cookieparser('secret'))
router.use(session({
    secret: 'secret',
    cookie: { maxAge: 4 * 60 * 60 * 1000 },
    resave: true,
    saveUninitialized: true
}))

router.use(passport.initialize())
router.use(passport.session())
router.use(flash())

router.use((req, res, next) => {
    res.locals.success_message = req.flash('success_message')
    res.locals.failure_message = req.flash('failure_message')
    res.locals.error = req.flash('error')
    next();
})



router.get('/register', (req, res) => res.render('register'))

router.post('/register', (req, res) => {
    let reg_error
    const { name, email, password, password2 } = req.body

    if(!name || !email || !password || !password2)
        reg_error = 'All the fields should be filled'
    else if(password.length < 6)
        reg_error = 'Password should be of atleast 6 characters'
    else if(password !== password2)
        reg_error = 'Passwords did not match'

    if(reg_error) {
        res.render('register', {
            reg_error,
            name,
            email,
            password,
            password2
        });
    } else {
        User.findOne({ email })
            .then(user => {
                if(user) {
                    reg_error = 'User Email already present!!!'
                    res.render('register', {
                        reg_error,
                        name,
                        email,
                        password,
                        password2
                    });
                } else {
                    admin_db.query(queryString.check_admin, email, (error, result) => {
                        if (error) throw error
                        
                        let isAdmin = false
                        if (result.length > 0) isAdmin = true
                        
                        const newUser = new User({
                            name,
                            email,
                            password,
                            isAdmin
                        })
                        bcrypt.genSalt(10, (err, salt) => {
                            if (err) throw err;
    
                            return bcrypt.hash(newUser.password, salt, (err, hash) => {
                                if(err) throw err
                                newUser.password = hash
                                newUser.save()
                                    .then(() => {
                                        req.flash('success_message', 'You are now registered')
                                        res.redirect('/users/login')
                                    })
                                    .catch(err => console.log(err))
                            })
                        })
                    })
                }
            })
            .catch(err => console.log(err))
    }
})


// Authentication:
authMiddleware.authentication(passport)

// End of user Authentication

router.get('/login', (req, res) => res.render('login'))

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        failureFlash: true,
        failureRedirect: '/users/login',
        successRedirect: '/home'
    })(req, res, next);
})

router.get('/logout', (req, res, next) => {
    req.logout();
    res.redirect('/users/login');
})


router.get('/profile/account', authMiddleware.validation, (req, res, next) => {
    res.render('profile', { 'user':req.user, 'event':'account' })
})

router.get('/profile/booking', authMiddleware.validation, (req, res, next) => {
    const query = `Select ticket_id from user_ticket where user_id = "${req.user._id}"`
    admin_db.query(query, (error, result) => {
        if (error) throw error;
        let ticket_id = [];

        Object.keys(result).forEach(key => ticket_id.push(result[key].ticket_id));
        Event.find({_id: {$in: ticket_id}}, (error, ticket) => {
            if (error) throw error;
            let productChunk = []
            const chunkSize = 1
            for (let i = 0; i < ticket.length; i += chunkSize) 
                productChunk.push(ticket.slice(i, i+chunkSize))
            res.render('profile', { 'user':req.user, 'cart': productChunk, 'event': 'booking' })
        });
    })
})


router.post('/profile/update', authMiddleware.validation, (req, res, next) => {
    console.log(req.body)
    res.redirect('/users/profile/overview')
})

router.get('/profile/overview', authMiddleware.validation, (req, res, next) => {
    res.render('profile', { 'user':req.user, 'event':'Overview' })
})


module.exports = router