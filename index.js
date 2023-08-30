const { ApolloServer } = require("apollo-server")
const typeDefs = require("./db/schemas")
const resolvers = require("./db/resolvers")
const conectarBD = require("./config/db")
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.variables.env' })

conectarBD()

const server = new ApolloServer({
  introspection: true,
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization.replace('Bearer ', '') || ''

    if (token) {
      try {
        const usuario = jwt.verify(token , process.env.SECRETA)
        
        return { usuario }
      } catch (error) {
        console.log('Error de autorización', error)
      }
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Run ${url}`)
})