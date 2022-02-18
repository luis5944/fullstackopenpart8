const { execute, subscribe } = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");

const { ApolloServer } = require("apollo-server-express");
const {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageGraphQLPlayground,
} = require("apollo-server-core");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const express = require("express");
const http = require("http");

const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/user");
const jwt = require("jsonwebtoken");
const typeDefs = require("./schema");
const resolvers = require("./reducers");

const JWT_SECRET = process.env.JWT_SECRET;

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("CONNECTED");
  })
  .catch((error) => {
    console.log(error);
  });

//Server without subscriptions
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   context: async ({ req }) => {
//     const auth = req ? req.headers.authorization : null;
//     if (auth && auth.toLowerCase().startsWith("bearer ")) {
//       const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
//       const currentUser = await User.findById(decodedToken.id);
//       return { currentUser };
//     }
//   },
//   plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
// });

// server.listen().then(({ url }) => {
//   console.log(`Server ready at ${url}`);
// });

// setup is now within a function
const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    {
      server: httpServer,
      path: "",
    }
  );

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null;
      if (auth && auth.toLowerCase().startsWith("bearer ")) {
        const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
        const currentUser = await User.findById(decodedToken.id);
        return { currentUser };
      }
    },
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground(),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              subscriptionServer.close();
            },
          };
        },
      },
    ],
  });

  await server.start();

  server.applyMiddleware({
    app,
    path: "/",
  });

  const PORT = 4000;

  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`)
  );
};

// call the function that does the setup and starts the server
start();
