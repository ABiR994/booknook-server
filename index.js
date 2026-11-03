import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";

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
