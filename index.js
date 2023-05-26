const { ApolloServer, gql } = require("apollo-server")

// server
const server = new ApolloServer()

// run server
server.listen().then(({ url }) => {
  console.log(`Run server ${url}`)
})