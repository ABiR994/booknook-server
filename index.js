import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

const app = express();
const port = process.env.PORT || 5000;

/* -------------------------------------------------------------------------- */
/*                                 Middleware                                 */
/* -------------------------------------------------------------------------- */

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

/* -------------------------------------------------------------------------- */
/*                                  MongoDB                                   */
/* -------------------------------------------------------------------------- */

if (!process.env.MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to your .env file.");
}

const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let database;

// Connect lazily so the same code works locally and on Vercel (serverless).
async function getDatabase() {
  if (!database) {
    await client.connect();
    database = client.db(process.env.DB_NAME || "booknook");
  }
  return database;
}

// Collections used by the routes that are added in the next steps.
export const booksCollection = async () => (await getDatabase()).collection("books");
export const borrowsCollection = async () => (await getDatabase()).collection("borrows");

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

app.get("/", (req, res) => {
  res.send({ name: "BookNook API", status: "running" });
});

// ---- Books ---------------------------------------------------------------

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// GET /books            all books
// GET /books?sort=newest&limit=6   the latest 6 books (New Arrivals)
// Optional: sort=newest|oldest, limit=1-100
app.get("/books", async (req, res) => {
  const { sort, limit } = req.query;

  if (sort !== undefined && !["newest", "oldest"].includes(sort)) {
    return res.status(400).send({ message: "sort must be newest or oldest." });
  }

  let maxBooks = 0; // 0 means no limit in MongoDB
  if (limit !== undefined) {
    maxBooks = Number(limit);
    if (!Number.isInteger(maxBooks) || maxBooks < 1 || maxBooks > 100) {
      return res.status(400).send({ message: "limit must be a whole number from 1 to 100." });
    }
  }

  const books = await booksCollection();
  const query = books.find();
  if (sort) query.sort({ createdAt: sort === "newest" ? -1 : 1 });
  const result = await query.limit(maxBooks).toArray();

  res.send(result);
});

// GET /books/:id        one book
app.get("/books/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).send({ message: "Invalid book id." });
  }

  const books = await booksCollection();
  const book = await books.findOne({ _id: new ObjectId(id) });

  if (!book) {
    return res.status(404).send({ message: "Book not found." });
  }

  res.send(book);
});

// Checks that MongoDB can be reached.
app.get("/health", async (req, res) => {
  const db = await getDatabase();
  await db.command({ ping: 1 });
  res.send({ status: "ok", database: db.databaseName });
});

/* -------------------------------------------------------------------------- */
/*                               Error handling                                */
/* -------------------------------------------------------------------------- */

app.use((req, res) => {
  res.status(404).send({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send({ message: "Something went wrong on the server." });
});

// Vercel runs the exported app, so only listen when running locally.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`BookNook server is running on port ${port}`);
  });
}

export default app;
