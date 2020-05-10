const path = require('path')
const fs = require('fs')
const express = require('express')
const mongoose = require('mongoose')
const layout = require('express-ejs-layouts')
const passport = require('passport')
const session = require('express-session')
const mysql = require('mysql')


const authMiddleware = require('./util/passport')
const users = require('./routes/users')
const welcome = require('./routes/index')
const db = require('./util/connection')
const Event = require('./model/event')
const queryString = require('./util/sql_query')


const admin_db = db.mysql_admin(mysql)
const app = express()
const dirName = path.join(__dirname, 'public')


db.mongo_user_reg(mongoose)


app.use(session({
    secret: 'secret',
    cookie: { maxAge: 4 * 60 * 60 * 1000 },
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(express.static(dirName)) 
    
authMiddleware.authentication(passport)

// Home routes
app.get('/home', (req, res) => {
    const filenames = fs.readdirSync(path.join(__dirname, '/public/images/thumbs/masonry')).map(file => {
        if (file.includes('.jpg'))
        return file
    })
    res.render('index', { "user": req.user, "files":filenames })
})

app.get('/about', (req, res) => res.render('about', { "user": req.user }))

app.get('/category', (req, res) => res.render('category', { "user": req.user }))

app.get('/create_event', (req, res) => res.sendFile(path.join(__dirname, "/public/create_events.html")))

app.get('/style-guide', (req, res) => res.render('style-guide', { "user": req.user }))

app.get('/single-video', (req, res) => res.render('single-video', { "user": req.user }))

app.get('/contact', (req, res) => res.render('contact', { "user": req.user }))

app.post('/create_events', authMiddleware.validation, (req, res, next) => {
    console.log(req.body);
    const { name, email, phone, price, time, date, location, description, link } = req.body;
    // console.log('Storing Event...')
    new Event({
        name,
        date,
        phone,
        email,
        price,
        location,
        time,
        link, 
        description
    }).save()
    .then(() => res.redirect('/events'))
    .catch(err => res.render('/error'))
})

app.get('/events', (req, res) => {
    Event.find((err, result) => {
        if (err) throw err;
        let productChunk = []
        const chunkSize = 1
        for (let i = 0; i < result.length; i += chunkSize) 
            productChunk.push(result.slice(i, i+chunkSize))
        console.log(productChunk)
        res.render('events', { "events": productChunk })
    })
})

app.get('/buy/:id', authMiddleware.validation, (req, res) => {
    const ticket_id = req.params.id
    const user = req.user;
    let query = `insert into user_ticket (user_id, ticket_id, user_email) 
        values ("${user._id}", "${ticket_id}", "${user.email}")`
    admin_db.query(query, (err, result) => {
        if (err) throw err
        console.log('Inserted....')
        res.redirect('/events')
    })
})

app.get('/delete/:id', authMiddleware.validation, (req, res) => {
    const ticket_id = req.params.id
    const user = req.users;
    let query = `delete from user_ticket where ticket_id = "${ticket_id}"`
    admin_db.query(query, (error, result) => {
        if (error) throw error;
        console.log(`Removed ticket ID ${ticket_id}`)
        res.redirect('/users/profile/overview')
    })
})


// Different routes:
app.use(layout)
app.use('/welcome', welcome)
app.use('/users', users)


app.listen(8000, () => {
    console.log('Server up on port 8000')
})