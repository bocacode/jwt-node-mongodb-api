import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import 'dotenv/config'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const URI = process.env.MONGO_URI
const client = new MongoClient(URI)
client.connect()
console.log('Connected to Mongo')
const database = client.db('jwt-api')
const usersdb = database.collection('users')

const app = express()
app.use(cors())
app.use(express.json())

app.listen(4040, () => console.log('Api running'))

app.post('/signup', async (req, res) => {
  const newUser = { email: 'jane@gmail.com', password: 'pass1234' }
  const hashedPassword = await bcrypt.hash(newUser.password, 10)

  await usersdb.insertOne({ email: newUser.email, password: hashedPassword })

  res.status(201).send('User was added 😎')
})

app.post('/login', async (req, res) => {
  const user = await usersdb.findOne({ email: req.body.email })
  const userAllowed = await bcrypt.compare(req.body.password, user.password)

  if (userAllowed) {
    const accessToken = jwt.sign(user, process.env.PRIVATE_KEY)
    res.send({ accessToken: accessToken })
  } else {
    res.send('No user found or invalid password')
  }
})

app.get('/', async (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.PRIVATE_KEY, async (err, decoded) => {
    console.log(decoded)
    if (decoded) {
      const allUsers = await usersdb.find().toArray()
      // res.send({ message: `Welcome ${decoded.email}` })
      res.send(allUsers)
    } else if (err) {
      res.status(401).send({ error: 'You must use a valid token' })
    }
  })
})
