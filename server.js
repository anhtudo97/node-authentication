const express = require('express')
const session = require('express-session')

const app = express()

// Setup session
app.use(session({
    secret: '9809898-987908-90890DD-987908-45644GG',
    resave: false,
    // dont send cookie to server keep it to browser
    saveUninitialized: true
}))

// Recording the times people who visited
app.use((req, res, next) => {
    if (!req.session.visits) {
        req.session.visits = {
            '/': 0,
            '/private': 0
        }
    }
    next()
})

// Recording the ip address
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    req.session.ip = ip
    next()
})

// Get home '/' was visited times
app.get('/', (req, res, next)=>{
    ++req.session.visits['/']
    res.send(`You visited ${JSON.stringify(req.session.visits)} times. Last time from ${req.session.ip}`)
})

// Get private '/private' was visited times
app.get('/private', (req, res, next)=>{
    ++req.session.visits['/private']
    res.send(`You visited ${JSON.stringify(req.session.visits)} times. Last time from ${req.session.ip}`)
})

app.listen(3000)