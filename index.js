const { ApolloServer, gql } = require("apollo-server")
const typeDefs = require("./db/schemas")
const resolvers = require("./db/resolvers")
const conectarBD = require("./config/db")

// conexion con la BD de mongo
conectarBD()

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`Run ${url}`)
})