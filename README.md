 <div align="center">

<img src="https://raw.githubusercontent.com/ABiR994/booknook-client/Main/src/app/icon.svg" alt="BookNook Logo" width="90" />

# BookNook – Backend API

### Powering the library behind every book, borrow and return.

A RESTful backend API for BookNook, a small online library where readers can add books, explore collections, borrow books and return them. Built with Express.js, MongoDB and JWT authentication, providing secure access to book management and borrowing operations.

<br />

<a href="https://booknook-mocha.vercel.app/">
  <img src="https://img.shields.io/badge/Live%20Application-Visit%20Website-15803d?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Application" />
</a>
<a href="https://github.com/ABiR994/booknook-server">
  <img src="https://img.shields.io/badge/Server%20Source-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
</a>
<a href="https://github.com/ABiR994/booknook-client">
  <img src="https://img.shields.io/badge/Client%20Source-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Client Repository" />
</a>

<br />
<br />

<img src="https://img.shields.io/badge/Node.js-Runtime-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
<img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
<img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
<img src="https://img.shields.io/badge/jose-Token%20Verification-6C47FF?style=flat-square" alt="jose" />
<img src="https://img.shields.io/badge/Vercel-Deployment-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />

</div>

---

## 📖 About the Project

**BookNook Server** is the backend REST API for [BookNook](https://booknook-mocha.vercel.app/), a small online library built around a simple idea: **Add a book, borrow a book, return a book.**

The server handles book management, borrowing operations, database interactions and authentication for protected API routes.

Built with **Express.js 5** and the native MongoDB Node.js driver, the API provides endpoints for creating, retrieving, updating and deleting books, as well as borrowing and returning them.

Authentication is handled through JWT verification using `jose`. The server validates tokens against the BetterAuth JWKS endpoint before allowing access to protected operations.

The backend is deployed on Vercel and communicates with the separate Next.js frontend.

---

## 🔗 Links

- **Live Application:** [booknook-mocha.vercel.app](https://booknook-mocha.vercel.app/)
- **Server Repository:** [github.com/ABiR994/booknook-server](https://github.com/ABiR994/booknook-server)
- **Client Repository:** [github.com/ABiR994/booknook-client](https://github.com/ABiR994/booknook-client)

---

## ✨ Key Features

### 📚 Book Management API

Provides RESTful endpoints for managing the library's book collection.

- Retrieve all books.
- Retrieve an individual book by its ID.
- Add new books to the database.
- Update existing book information.
- Delete books with ownership validation.
- Prevent deletion of books that are currently borrowed.

### 🔍 Book Retrieval and Sorting

The API supports retrieving the complete library and individual book details.

The books endpoint supports query parameters for sorting and limiting results.

Example:

```http
GET /books?sort=newest&limit=6
```

This allows the frontend to retrieve the latest 6 books for its New Arrivals section.

### ➕ Add Book

Authenticated users can contribute new books to the shared library.

The server stores:

- Book title.
- Author name.
- Category.
- Book image URL.
- Description.
- Total copies.
- Available copies.
- Contributor name and email.
- Creation date.

The contributor information is associated with the authenticated user.

### ✏️ Update and Delete Books

The API supports updating and deleting books through protected endpoints.

- `PATCH` updates existing book information.
- `DELETE` removes a book from the collection.
- Ownership verification ensures users can only manage their own books.
- Books cannot be deleted while they have active borrowing records.

### 🔄 Borrowing System

The borrowing system manages book availability and borrowing records.

When a user borrows a book:

1. The server validates the authenticated user.
2. Checks whether the requested book exists.
3. Checks available copies.
4. Prevents duplicate active borrowing by the same user.
5. Creates a borrowing record.
6. Decreases the available copy count by one.

Borrowing records contain the book ID, book title, book image, user email, borrow date and return date.

### ↩️ Return Book

Users can return books they previously borrowed.

When a book is returned:

- The borrowing record is removed.
- The corresponding book's available copy count increases by one.
- The database reflects the updated availability.

### 📦 Available Copies Management

Book availability is maintained through MongoDB atomic update operations.

- Borrowing decreases available copies.
- Returning increases available copies.
- Borrowing is rejected when no copies remain.
- Copy updates use `$inc` to avoid simple read-modify-write inconsistencies.

### 🔐 JWT Authentication with BetterAuth

Protected API routes use JWT-based authentication.

The server uses `jose` to verify incoming tokens against the BetterAuth JWKS endpoint.

The `verifyToken` middleware:

- Extracts the bearer token from the Authorization header.
- Verifies the token signature.
- Validates the token against the configured JWKS endpoint.
- Rejects invalid or missing authentication tokens.
- Makes the authenticated user information available to protected routes.

Public endpoints remain accessible without authentication.

### 🌐 CORS Configuration

Cross-Origin Resource Sharing is configured to allow requests from the BookNook client application.

This restricts browser-based cross-origin access to the configured frontend origin.

### ❤️ Health Check

A health endpoint is available to check the server and MongoDB connection.

```http
GET /health
```

Useful for verifying that the backend is running and the database connection is available.

### 🌱 Database Seeding

The project includes a seed script that inserts 12 sample books into MongoDB.

This makes it easier to populate the library during initial development and testing.

### ☁️ Vercel Deployment

The server is configured for Vercel deployment using `vercel.json`.

The application can run locally during development and be deployed independently from the Next.js frontend.

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| 🟢 Node.js | JavaScript runtime |
| 🚀 Express.js 5 | REST API framework |
| 🍃 MongoDB | NoSQL database |
| 🔷 MongoDB Native Driver | Database operations and queries |
| 🔐 jose | JWT verification and JWKS integration |
| 🔑 BetterAuth | Authentication and token issuer |
| 🌐 CORS | Cross-origin request configuration |
| ▲ Vercel | Server deployment |

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
```

**Update a book**

```http
PATCH /books/:id
Authorization: Bearer <token>
Content-Type: application/json
```

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

Each document represents an active borrowing record.

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
├── src/
│   ├── middleware/
│   │   └── verifyToken.js
│   │
│   ├── config/
│   │
│   ├── index.js
│   └── seed.js
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
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
- A configured BetterAuth application on the client side.

### Installation

Clone the server repository:

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

Fill in the values in `.env`:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `DB_NAME` | MongoDB database name |
| `CLIENT_URL` | Frontend origin allowed by CORS |
| `JWKS_URL` | BetterAuth JWKS endpoint used for JWT verification |
| `PORT` | Local server port (default: `5000`) |

### Seed Sample Books

To insert the 12 sample books into MongoDB, run:

```bash
npm run seed
```

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
6. Configure `JWKS_URL` with your BetterAuth JWKS endpoint.
7. Ensure MongoDB Atlas allows connections from the deployed backend.
8. Deploy the application and verify the `/health` endpoint.

The frontend communicates with this backend through the configured API URL.

---

## 🔗 Related Project

**BookNook Client**

The frontend is built separately using Next.js, React, TypeScript and Tailwind CSS.

[View Client Repository](https://github.com/ABiR994/booknook-client)

[Visit Live Application](https://booknook-mocha.vercel.app/)

---

## 👨‍💻 Author

**Salem Nur Abir**

CSE Student | Aspiring Software Engineer

<a href="https://github.com/ABiR994">
  <img src="https://img.shields.io/badge/GitHub-ABiR994-181717?style=for-the-badge&logo=github" alt="GitHub" />
</a>
<a href="https://linkedin.com/in/salem-nur-abir/">
  <img src="https://img.shields.io/badge/LinkedIn-Salem%20Nur%20Abir-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
</a>
<a href="https://abir994.pro.bd/">
  <img src="https://img.shields.io/badge/Portfolio-Visit%20Website-15803d?style=for-the-badge&logo=vercel&logoColor=white" alt="Portfolio" />
</a>

