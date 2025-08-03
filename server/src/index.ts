import express from 'express'
import * as dotenv from 'dotenv'
import bodyParser from 'body-parser'

// import session from 'express-session'
// import passport from 'passport'
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import translateRoutes from './routes/translateRoutes'
import summarizeRoutes from './routes/summarizeRoutes'
import saveRoutes from './routes/saveRoutes'
import smoothRoutes from './routes/smoothRoutes'
import taskRoutes from './routes/taskRoutes'
dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.json())

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

// app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }))
// app.use(passport.initialize())
// app.use(passport.session())

// passport.use(new GoogleStrategy({
//   clientID: GOOGLE_CLIENT_ID,
//   clientSecret: GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback'
// }, (accessToken, refreshToken, profile, done) => {
//   return done(null, profile)
// }))

// passport.serializeUser((user, done) => {
//   done(null, user)
// })

// passport.deserializeUser((user, done) => {
//   done(null, user)
// })

// app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  // res.redirect('/')
// })

app.use('/translate', translateRoutes)
app.use('/summarize', summarizeRoutes)
app.use('/save', saveRoutes)
app.use('/smooth', smoothRoutes)
app.use('/tasks', taskRoutes)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})
