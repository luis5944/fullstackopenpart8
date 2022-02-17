const { ApolloServer, gql } = require("apollo-server");
const {
  ApolloServerPluginLandingPageGraphQLPlayground,
  UserInputError,
} = require("apollo-server-core");
const { v1: uuid } = require("uuid");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Book = require("./models/book");
const Author = require("./models/author");
const User = require("./models/user");
const jwt = require("jsonwebtoken");
dotenv.config();

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

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    bookCount: Int!
    id: ID!
    born: Int
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book

    editAuthor(name: String!, setBornTo: Int!): Author

    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }
`;

const resolvers = {
  Query: {
    bookCount: async () => (await Book.find({})).length,
    authorCount: async () => (await Author.find({})).length,
    allBooks: async (root, args) => {
      const authorF = await Author.findOne({ name: args.author });
      if (authorF) {
        if (args.author && args.genre) {
          return await Book.find({
            author: authorF._id,
            genres: { $in: [args.genre] },
          }).populate("author");
        }
        if (args.author) {
          const authorF = await Author.findOne({ name: args.author });
          return await Book.find({ author: authorF._id }).populate('author');
        }
      }

      if (args.genre && !args.author) {
        return await Book.find({ genres: { $in: [args.genre] } }).populate(
          "author"
        );
      }
      if (!args.genre && !args.author) {
        return await Book.find({}).populate("author");
      }
      return [];
    },
    allAuthors: async () => await Author.find({}),
    me: (root, args, context) => {
      return context.currentUser;
    },
  },

  Mutation: {
    addBook: async (root, args, context) => {
      const existAuthor = await Author.findOne({ name: args.author });
      const existBook = await Book.findOne({ title: args.title });
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }
      if (existBook) {
        throw new UserInputError("Book already exist", {
          invalidadArgs: args.title,
        });
      }
      let newAuthor;
      if (!existAuthor) {
        const author = new Author({ name: args.author, born: null });
        try {
          newAuthor = await author.save();
        } catch (error) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        }
      }

      const book = new Book({
        ...args,
        author: existAuthor ? existAuthor : newAuthor,
      });

      try {
        await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidadArgs: args,
        });
      }

      return book;
    },

    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser;
      if (!currentUser) {
        throw new AuthenticationError("not authenticated");
      }
      const authorFound = await Author.findOne({ name: args.name });
      if (!authorFound) {
        return null;
      }

      authorFound.born = args.setBornTo;

      return await authorFound.save();
    },
    createUser: async (root, args) => {
      const user = new User({ ...args });

      return await user.save().catch((error) => {
        throw new UserInputError(error.message, { invalidArgs: args });
      });
    },
    login: async (root, args, context) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "852456") {
        throw new UserInputError("wrong credentials");
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },

  Author: {
    bookCount: async (root) => {
      const author = await Author.findOne({ name: root.name });
      return (await Book.find({ author: author._id })).length;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
