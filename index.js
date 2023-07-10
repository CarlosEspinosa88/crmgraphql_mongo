const { ApolloServer, gql } = require("apollo-server")
const typeDefs = require("./db/schemas")
const resolvers = require("./db/resolvers")

const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`Run   ${url}`)
})