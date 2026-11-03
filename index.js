import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

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

async function getDatabase() {
  if (!database) {
    await client.connect();
    database = client.db(process.env.DB_NAME || "booknook");

    try {
      await database.collection("borrows").createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
    } catch (error) {
      console.error("Could not create the borrows index:", error.message);
    }
  }
  return database;
}

export const booksCollection = async () => (await getDatabase()).collection("books");
export const borrowsCollection = async () => (await getDatabase()).collection("borrows");

let jwks;

const getJwks = () => {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${process.env.AUTH_BASE_URL}/api/auth/jwks`));
  }
  return jwks;
};

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

app.get("/", (req, res) => {
  res.send({ name: "BookNook API", status: "running" });
});

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const CATEGORIES = ["Fiction", "Science", "History", "Kids", "Others"];

const isImageUrl = (value) => /^https?:\/\/\S+$/i.test(value);

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

app.get("/books", async (req, res) => {
  const { sort, limit } = req.query;

  if (sort !== undefined && !["newest", "oldest"].includes(sort)) {
    return res.status(400).send({ message: "sort must be newest or oldest." });
  }

  let maxBooks = 0;
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

app.patch("/books/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).send({ message: "Invalid book id." });
  }

  const { error, book: changes } = validateBook(req.body);
  if (error) {
    return res.status(400).send({ message: error });
  }

  const books = await booksCollection();
  const existing = await books.findOne({ _id: new ObjectId(id) });

  if (!existing) {
    return res.status(404).send({ message: "Book not found." });
  }
  if (existing.addedBy?.email !== req.user.email) {
    return res.status(403).send({ message: "You can only edit books that you added." });
  }

  const borrowedNow = existing.totalCopies - existing.availableCopies;
  if (changes.totalCopies < borrowedNow) {
    return res.status(400).send({
      message: `Total copies cannot be less than the ${borrowedNow} copies currently borrowed.`,
    });
  }

  const updated = await books.findOneAndUpdate(
    {
      _id: existing._id,
      "addedBy.email": req.user.email,
      $expr: { $gte: [changes.totalCopies, { $subtract: ["$totalCopies", "$availableCopies"] }] },
    },
    [
      {
        $set: {
          ...changes,
          availableCopies: {
            $subtract: [changes.totalCopies, { $subtract: ["$totalCopies", "$availableCopies"] }],
          },
        },
      },
    ],
    { returnDocument: "after" },
  );

  if (!updated) {
    return res.status(409).send({ message: "The book changed while you were editing it. Please try again." });
  }

  res.send({ message: "Book updated successfully.", book: updated });
});

app.delete("/books/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).send({ message: "Invalid book id." });
  }

  const books = await booksCollection();
  const existing = await books.findOne({ _id: new ObjectId(id) });

  if (!existing) {
    return res.status(404).send({ message: "Book not found." });
  }
  if (existing.addedBy?.email !== req.user.email) {
    return res.status(403).send({ message: "You can only delete books that you added." });
  }

  const borrows = await borrowsCollection();
  if ((await borrows.countDocuments({ bookId: id })) > 0) {
    return res.status(409).send({ message: "This book is currently borrowed, so it cannot be deleted yet." });
  }

  await books.deleteOne({ _id: existing._id });
  res.send({ message: "Book deleted successfully." });
});

const LOAN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

app.post("/borrows", verifyToken, async (req, res) => {
  const bookId = String(req.body?.bookId ?? "");

  if (!isValidId(bookId)) {
    return res.status(400).send({ message: "A valid book id is required." });
  }

  const books = await booksCollection();
  const borrows = await borrowsCollection();
  const userEmail = req.user.email;

  const book = await books.findOne({ _id: new ObjectId(bookId) });
  if (!book) {
    return res.status(404).send({ message: "Book not found." });
  }

  if (await borrows.findOne({ bookId, userEmail })) {
    return res.status(409).send({ message: "You have already borrowed this book." });
  }

  const updated = await books.findOneAndUpdate(
    { _id: book._id, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { returnDocument: "after" },
  );
  if (!updated) {
    return res.status(409).send({ message: "Sorry, this book is not available right now." });
  }

  const borrowDate = new Date();
  const borrow = {
    bookId,
    bookTitle: book.title,
    bookImage: book.image,
    userEmail,
    borrowDate,
    returnDate: new Date(borrowDate.getTime() + LOAN_DAYS * DAY_MS),
  };

  try {
    const result = await borrows.insertOne(borrow);
    res.status(201).send({
      message: "Book borrowed successfully.",
      borrow: { _id: result.insertedId, ...borrow },
      availableCopies: updated.availableCopies,
    });
  } catch (error) {
    await books.updateOne({ _id: book._id }, { $inc: { availableCopies: 1 } });
    if (error.code === 11000) {
      return res.status(409).send({ message: "You have already borrowed this book." });
    }
    throw error;
  }
});

app.get("/borrows", verifyToken, async (req, res) => {
  const borrows = await borrowsCollection();
  const result = await borrows.find({ userEmail: req.user.email }).sort({ borrowDate: -1 }).toArray();
  res.send(result);
});

app.delete("/borrows/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(400).send({ message: "Invalid borrow id." });
  }

  const borrows = await borrowsCollection();
  const borrow = await borrows.findOneAndDelete({ _id: new ObjectId(id), userEmail: req.user.email });

  if (!borrow) {
    return res.status(404).send({ message: "Borrow record not found." });
  }

  const books = await booksCollection();
  await books.updateOne({ _id: new ObjectId(borrow.bookId) }, { $inc: { availableCopies: 1 } });

  res.send({ message: "Book returned successfully." });
});

app.get("/health", async (req, res) => {
  const db = await getDatabase();
  await db.command({ ping: 1 });
  res.send({ status: "ok", database: db.databaseName });
});

app.use((req, res) => {
  res.status(404).send({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send({ message: "Something went wrong on the server." });
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`BookNook server is running on port ${port}`);
  });
}

export default app;
