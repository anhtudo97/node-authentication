const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')

const app = express()

const mongodb = require('mongodb')
const path = require('path')
const package = require(path.join(__dirname, 'package.json'))

app.use(bodyParser.urlencoded({ extended: true }))


mongodb.connect('mongodb://localhost:27017', (error, client) => {
    if (error) return console.error(error)
    const db = client.db(package.name)

    // Setup session
    app.use(session({
        secret: '9809898-987908-90890DD-987908-45644GG',
        resave: false,
        // dont send cookie to server keep it to browser
        saveUninitialized: true
    }))

    const authorize = (req, res, next) => {
        if (!req.session.user) {
            next(new Error('Not logged in'))
        } else next()
    }

    app.get('/', (req, res, next) => {
        if (req.session.user) return res.redirect('/private')
        res.set('Content-Type', 'text/html')
        res.send(`<h2>Log in</h2>
        <form action="/login" method="POST">
          <input type="text" name="username"/>
          <input type="password" name="password"/>
          <button type="submit">Log in</button>
        </form>
        <hr/>
        <h2>Sign up</h2>
        <form action="/signup" method="POST">
          <input type="text" name="username"/>
          <input type="password" name="password"/>
          <button type="submit">Sign up</button>
        </form>
        `)
    })

    app.post('/login', (req, res, next) => {
        if (!req.body.password || !req.body.username) return next(new Error('Must provide username and password'))
        db.collection('users').findOne({ username: req.body.username },
            (error, user) => {
                if (error) return next(error)
                if (!user) return next(new Error('User name and/or password is wrong'))
                bcrypt.compare(req.body.password, user.password, (error, matched) => {
                    if (!error && matched) {
                        req.session.user = { username: user.username }
                        res.redirect('/private')
                    } else next(new Error('User name and/or password is wrong'))
                })
            })
    })

    app.post('/signup', (req, res, next) => {
        if (!req.body.password || !req.body.username) return next(new Error('Must provide username and password'))
        bcrypt.hash(req.body.password, 10, (error, hash) => { // 10 is good enough but you can make it more secure with 11
            if (error) return next(error)
            db.collection('users').insert({ username: req.body.username, password: hash }, (error, results) => {
                if (error) return next(error)
                req.session.user = { username: results.ops[0].username }
                res.redirect('/private')
            })
        })
    })

    app.get('/logout', (req, res, next) => {
        req.session.destroy()
        res.redirect('/')
    })



    app.get('/private', authorize, (req, res, next) => {
        res.send(`Hi ${req.session.user.username}
        <br/>
        <a href="/logout">Log out</a>
        `)
    })

    app.use((error, req, res, next) => {
        console.log(error)
        res.send(error.message)
    })

    app.listen(3000)
})