import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

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
/*                         JWT verification (Better Auth)                     */
/* -------------------------------------------------------------------------- */

let jwks;

// Better Auth (in the client app) signs the tokens. This server only verifies them
// with the public keys published at <AUTH_BASE_URL>/api/auth/jwks.
const getJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${process.env.AUTH_BASE_URL}/api/auth/jwks`));
  }
  return jwks;
};

// Add to every private route: app.post("/books", verifyToken, handler)
// On success the logged in user is available as req.user.
const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized: token is missing." });
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: process.env.AUTH_BASE_URL,
      audience: process.env.AUTH_BASE_URL,
    });
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch {
    res.status(401).send({ message: "Unauthorized: token is invalid or expired." });
  }
};

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

app.get("/", (req, res) => {
  res.send({ name: "BookNook API", status: "running" });
});

// ---- Books ---------------------------------------------------------------

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

const isImageUrl = (value) => /^https?:\/\/\S+$/i.test(value);

// Checks the fields of a book coming from the client.
// Returns { error } for the first problem, or { book } with clean values.
function validateBook(body = {}) {
  const title = String(body.title ?? "").trim();
  const author = String(body.author ?? "").trim();
  const category = String(body.category ?? "").trim();
  const image = String(body.image ?? "").trim();
  const description = String(body.description ?? "").trim();
  const totalCopies = Number(body.totalCopies);

  if (!title || title.length > 150) return { error: "Title is required (up to 150 characters)." };
  if (!author || author.length > 100) return { error: "Author name is required (up to 100 characters)." };
  if (!CATEGORIES.includes(category)) return { error: `Category must be one of: ${CATEGORIES.join(", ")}.` };
  if (!isImageUrl(image)) return { error: "A valid image URL is required." };
  if (!description || description.length > 1000) return { error: "Description is required (up to 1000 characters)." };
  if (!Number.isInteger(totalCopies) || totalCopies < 1 || totalCopies > 1000) {
    return { error: "Total copies must be a whole number from 1 to 1000." };
  }

  return { book: { title, author, category, image, description, totalCopies } };
}

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

// POST /books           add a book (private)
// The owner and the date come from the server, not from the request body.
app.post("/books", verifyToken, async (req, res) => {
  const { error, book } = validateBook(req.body);

  if (error) {
    return res.status(400).send({ message: error });
  }

  const newBook = {
    ...book,
    availableCopies: book.totalCopies,
    addedBy: { name: req.user.name, email: req.user.email },
    createdAt: new Date(),
  };

  const books = await booksCollection();
  const result = await books.insertOne(newBook);

  res.status(201).send({ message: "Book added successfully.", book: { _id: result.insertedId, ...newBook } });
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
