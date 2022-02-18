const Author = require("./models/author");
const Book = require("./models/book");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const { UserInputError, AuthenticationError } = require("apollo-server");
const { PubSub } = require("graphql-subscriptions");
const pubsub = new PubSub();

const JWT_SECRET = process.env.JWT_SECRET;
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
          return await Book.find({ author: authorF._id }).populate("author");
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
      pubsub.publish("BOOK_ADDED", { bookAdded: book });

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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]),
    },
  },
  Author: {
    bookCount: async (root) => {
      const author = await Author.findOne({ name: root.name });
      return (await Book.find({ author: author._id })).length;
    },
  },
};

module.exports = resolvers;
