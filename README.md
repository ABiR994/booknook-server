# BookNook Server

REST API for **BookNook**, a small online library where you add a book, borrow a book and return a book.

- Client repository: `booknook-client`
- Live API URL: _add your Vercel URL here after deployment_

## Features

- Express 5 server with the native MongoDB driver
- CORS limited to the client origin
- JWT verification with `jose` against the Better Auth JWKS endpoint (`verifyToken` middleware)
- Seed script with 12 sample books
- Ready for Vercel (`vercel.json`)

## API routes

| Method | Route          | Access  | Description                                              |
| ------ | -------------- | ------- | -------------------------------------------------------- |
| GET    | `/books`       | Public  | All books. `?sort=newest&limit=6` for New Arrivals       |
| GET    | `/books/:id`   | Public  | One book                                                 |
| POST   | `/books`       | Private | Add a book                                               |
| POST   | `/borrows`     | Private | Borrow a book (`{ bookId }`), copies -1, no double borrow |
| GET    | `/borrows`     | Private | Borrows of the logged in user                            |
| DELETE | `/borrows/:id` | Private | Return a book, copies +1                                 |

Private routes expect `Authorization: Bearer <token>`.

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
