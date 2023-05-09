const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const fs = require('fs');
const path = require('path');
const resolvers = require('./resolvers');

const typeDefs = gql(fs.readFileSync(path.join(__dirname, 'schema.graphql'), 'utf8'));

(async () => {
  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();

  const app = express();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
})();
