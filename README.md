# BookNook Server

REST API for **BookNook**, a small online library where you add a book, borrow a book and return a book.

- Client repository: `booknook-client`
- Live API URL: _add your Vercel URL here after deployment_

## Features

- Express 5 server with the native MongoDB driver
- CORS limited to the client origin
- Seed script with 12 sample books
- Ready for Vercel (`vercel.json`)

## Data model

```
books:   { title, author, category, image, description, totalCopies, availableCopies,
           addedBy: { name, email }, createdAt }
borrows: { bookId, bookTitle, bookImage, userEmail, borrowDate, returnDate }
```

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values
npm run seed           # optional: insert sample books
npm run dev
```

The server runs on `http://localhost:5000`. Open `/health` to check the MongoDB connection.
