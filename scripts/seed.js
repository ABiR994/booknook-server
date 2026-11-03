// Usage: npm run seed
// Inserts the sample books from data/books.json and creates the indexes.
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { MongoClient, ServerApiVersion } from "mongodb";

const ownerName = process.env.SEED_OWNER_NAME || "BookNook Librarian";
const ownerEmail = process.env.SEED_OWNER_EMAIL || "librarian@booknook.dev";

const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

async function seed() {
  const books = JSON.parse(await readFile(new URL("../data/books.json", import.meta.url), "utf8"));

  await client.connect();
  const db = client.db(process.env.DB_NAME || "booknook");

  // Remove the previous seed so the script can be run again safely.
  await db.collection("books").deleteMany({ "addedBy.email": ownerEmail });

  // Older dates first, so the last book in the file is the newest arrival.
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const documents = books.map((book, index) => ({
    ...book,
    addedBy: { name: ownerName, email: ownerEmail },
    createdAt: new Date(now - (books.length - index) * day),
  }));

  const { insertedCount } = await db.collection("books").insertMany(documents);

  await db.collection("books").createIndex({ createdAt: -1 });
  // A user can hold only one active borrow per book (returning deletes the record).
  await db.collection("borrows").createIndex({ bookId: 1, userEmail: 1 }, { unique: true });
  await db.collection("borrows").createIndex({ userEmail: 1 });

  console.log(`Seeded ${insertedCount} books for ${ownerEmail}.`);
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
