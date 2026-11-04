<div align="center">

<img src="https://raw.githubusercontent.com/ABiR994/booknook-client/Main/src/app/icon.svg" alt="BookNook Logo" width="90" />

# BookNook – Backend API

### Powering the library behind every book, borrow and return.

A RESTful backend API for BookNook, a small online library where readers can add books, explore collections, borrow books and return them. Built with Express.js, MongoDB and JWT authentication.

<br />

[![Live Application](https://img.shields.io/badge/Live%20Application-Visit%20Website-15803d?style=for-the-badge&logo=vercel&logoColor=white)](https://booknook-mocha.vercel.app/)
[![Server Repository](https://img.shields.io/badge/Server%20Source-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ABiR994/booknook-server)
[![Client Repository](https://img.shields.io/badge/Client%20Source-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ABiR994/booknook-client)

<br />

![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=flat-square&logo=vercel&logoColor=white)

</div>

---

## 📖 About the Project

**BookNook Server** is the backend REST API for [BookNook](https://booknook-mocha.vercel.app/), a small online library built around a simple idea: **Add a book, borrow a book, return a book.**

The server handles book management, borrowing operations, database interactions and authentication for protected API routes.

Built with **Express.js 5** and the native MongoDB Node.js driver, the API provides endpoints for creating, retrieving, updating and deleting books, as well as borrowing and returning them.

Authentication is handled through JWT verification using `jose`. The client app issues the tokens with BetterAuth, and this server validates them against the BetterAuth JWKS endpoint before allowing access to protected operations.

The backend is deployed on Vercel and communicates with the separate Next.js frontend.

## 🔗 Links

- **Live Application:** https://booknook-mocha.vercel.app/
- **Server Repository:** https://github.com/ABiR994/booknook-server
- **Client Repository:** https://github.com/ABiR994/booknook-client

---

## ✨ Key Features

### 📚 Book Management

- Retrieve all books from the database.
- Retrieve individual books by ID.
- Add new books.
- Update existing book information.
- Delete books with ownership validation.
- Prevent deletion of books with active borrowing records.

### 🔍 Book Retrieval and Sorting

The books endpoint supports sorting and limiting results through query parameters.

```http
GET /books?sort=newest&limit=6
```

Supported options:

- `sort=newest` – Newest books first.
- `sort=oldest` – Oldest books first.
- `limit=6` – Limit the number of returned books (a whole number from 1 to 100).

Invalid values return a `400` response with a clear message.

### ➕ Add Book

Authenticated users can contribute new books to the shared library.

Each book stores:

- Title and author.
- Category and image URL.
- Description.
- Total and available copies.
- Contributor name and email.
- Creation date.

Contributor information and the creation date are set by the server, not taken from the request body.

### ✅ Input Validation

Book data is validated before it is saved:

- Title is required (up to 150 characters).
- Author is required (up to 100 characters).
- Category must be Fiction, Science, History, Kids or Others.
- Image must be a valid `http` or `https` URL.
- Description is required (up to 1000 characters).
- Total copies must be a whole number from 1 to 1000.

### ✏️ Update and Delete Books

- `PATCH` updates existing book information.
- `DELETE` removes a book from the collection.
- Ownership verification ensures users can only manage their own books (a `403` is returned otherwise).
- Books cannot be deleted while they have active borrowing records.
- Updating total copies recalculates available copies while preserving the copies that are currently borrowed. Total copies cannot be set below that number.

### 🔄 Borrowing System

The borrowing system manages book availability and borrowing records.

When a user borrows a book, the server:

1. Validates the authenticated user.
2. Checks that the requested book exists.
3. Prevents the user from borrowing a book they already have.
4. Takes one copy only if a copy is available, in a single atomic step.
5. Saves the borrowing record, with the return date set 7 days after the borrow date.
6. Puts the copy back if the record cannot be saved.

Borrowing records contain the book ID, title, image, user email, borrow date and return date.

### ↩️ Return Book

Users can return books they previously borrowed.

When a book is returned:

- The borrowing record is removed (only its owner can return it).
- The corresponding book's available copy count increases by one.

### 📦 Available Copies Management

Book availability is maintained through MongoDB atomic update operations.

- Borrowing decreases available copies with `$inc`.
- Returning increases available copies with `$inc`.
- Borrowing is rejected when no copies remain, and the count never goes below zero.
- Borrowing the last available copy is handled atomically, so two users cannot both get it.
- A unique index on `bookId` and `userEmail` (created automatically when the server connects to the database) blocks duplicate active borrows, even for simultaneous requests.

### 🔐 JWT Authentication with BetterAuth

Protected API routes use JWT-based authentication.

The server uses `jose` to verify incoming tokens against the BetterAuth JWKS endpoint (`<AUTH_BASE_URL>/api/auth/jwks`).

The authentication middleware:

- Extracts the bearer token from the Authorization header.
- Verifies the token signature.
- Validates the token issuer and audience.
- Rejects missing, invalid or expired tokens with `401`.
- Makes the authenticated user's id, name and email available to protected routes.

Public endpoints remain accessible without authentication.

### 🌐 CORS Configuration

Cross-Origin Resource Sharing is configured to allow requests from the BookNook frontend origin (`CLIENT_URL`). Several origins can be listed, separated by commas.

### ❤️ Health Check

A health endpoint checks whether the server and MongoDB connection are working.

```http
GET /health
```

The root route (`GET /`) returns a simple status message. Unknown routes return a JSON `404`, and unexpected errors return a JSON `500`.

### ☁️ Vercel Deployment

The server exports the Express app for Vercel (`vercel.json` is included) and only starts listening on a port when it runs locally.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| Node.js | JavaScript runtime |
| Express.js 5 | REST API framework |
| MongoDB | NoSQL database |
| MongoDB Native Driver | Database operations and queries |
| jose | JWT verification and JWKS integration |
| BetterAuth | Authentication and token issuer (runs in the client app) |
| CORS | Cross-origin request configuration |
| Vercel | Server deployment |

---

## 🧭 API Routes

The server exposes 8 REST API endpoints.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/books` | Public | Retrieve all books |
| GET | `/books/:id` | Public | Retrieve a single book |
| POST | `/books` | Private | Add a new book |
| PATCH | `/books/:id` | Private | Update a book (owner only) |
| DELETE | `/books/:id` | Private | Delete a book (owner only) |
| POST | `/borrows` | Private | Borrow a book |
| GET | `/borrows` | Private | Retrieve the logged-in user's borrows |
| DELETE | `/borrows/:id` | Private | Return a borrowed book |

### Authentication Header

All private endpoints require a valid JWT access token.

```http
Authorization: Bearer <token>
```

### Example API Requests

**Retrieve all books**

```http
GET /books
```

**Retrieve the latest 6 books**

```http
GET /books?sort=newest&limit=6
```

**Add a book**

```http
POST /books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Book title",
  "author": "Author name",
  "category": "Fiction",
  "image": "https://example.com/cover.jpg",
  "description": "A short description.",
  "totalCopies": 3
}
```

**Update a book**

```http
PATCH /books/:id
Authorization: Bearer <token>
Content-Type: application/json
```

The body has the same fields as when adding a book.

**Borrow a book**

```http
POST /borrows
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "BOOK_ID"
}
```

**Retrieve personal borrowing records**

```http
GET /borrows
Authorization: Bearer <token>
```

**Return a book**

```http
DELETE /borrows/:id
Authorization: Bearer <token>
```

---

## 🗄️ Database Structure

BookNook uses MongoDB to store books and borrowing records in separate collections.

### Books Collection

Each document represents a book contributed by a library member.

```javascript
{
  title: String,
  author: String,
  category: String,
  image: String,
  description: String,

  totalCopies: Number,
  availableCopies: Number,

  addedBy: {
    name: String,
    email: String
  },

  createdAt: Date
}
```

### Borrows Collection

Each document represents an active borrowing record. Returning a book deletes its record.

```javascript
{
  bookId: String,
  bookTitle: String,
  bookImage: String,

  userEmail: String,

  borrowDate: Date,
  returnDate: Date
}
```

---

## 📂 Project Structure

```text
booknook-server/
│
├── index.js
│
├── .env.example
├── .gitignore
├── package.json
└── vercel.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or later.
- npm.
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
- The BookNook client running with BetterAuth configured ([booknook-client](https://github.com/ABiR994/booknook-client)).

### Installation

Clone the repository:

```bash
git clone https://github.com/ABiR994/booknook-server.git
cd booknook-server
```

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Configure the required environment variables.

### Environment Variables

Add the following variables to your `.env` file:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DB_NAME` | MongoDB database name (defaults to `booknook`) |
| `CLIENT_URL` | Frontend origin allowed by CORS (no trailing slash) |
| `AUTH_BASE_URL` | Base URL of the BetterAuth application. It must match the client's `BETTER_AUTH_URL` |
| `PORT` | Local server port (default: `5000`, not needed on Vercel) |

### Run Development Server

```bash
npm run dev
```

The server runs at:

```text
http://localhost:5000
```

### Check Server Health

Open the following endpoint:

```text
http://localhost:5000/health
```

It checks the server and MongoDB connection.

---

## ☁️ Deployment

The backend is configured for deployment on **Vercel**.

When deploying your own copy:

1. Import the server repository into Vercel.
2. Configure the required environment variables in Vercel project settings.
3. Set `MONGODB_URI` to your MongoDB Atlas connection string.
4. Configure `DB_NAME` with your database name.
5. Set `CLIENT_URL` to your deployed frontend origin.
6. Set `AUTH_BASE_URL` to your deployed frontend URL, the same value as the client's `BETTER_AUTH_URL`.
7. Ensure MongoDB Atlas allows connections from the deployed backend (Network Access).
8. Deploy the application and verify the `/health` endpoint.

Redeploy after changing environment variables. The frontend communicates with this backend through its `NEXT_PUBLIC_API_URL`.

---

## 🔗 Related Project

### BookNook Client

The frontend is built separately using Next.js, React, TypeScript and Tailwind CSS.

- [View Client Repository](https://github.com/ABiR994/booknook-client)
- [Visit Live Application](https://booknook-mocha.vercel.app/)

---

## 👨‍💻 Author

**Salem Nur Abir**

CSE Student | Aspiring Software Engineer

[![GitHub](https://img.shields.io/badge/GitHub-ABiR994-181717?style=for-the-badge&logo=github)](https://github.com/ABiR994)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Salem%20Nur%20Abir-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/salem-nur-abir/)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit%20Website-15803d?style=for-the-badge&logo=vercel&logoColor=white)](https://abir994.pro.bd/)
