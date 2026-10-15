# Fieldstore

A responsive e-commerce practice app built with React, Vite, Express, and MongoDB. MongoDB stores users, products, categories, and orders. The browser stores only the cart and authentication token.

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGODB_URI` to your MongoDB Atlas connection string and replace its placeholders. Set a long random `JWT_SECRET`.
3. Set `ADMIN_EMAIL`. To create the admin automatically on startup, also set `ADMIN_PASSWORD` to a strong password. If it is blank, register through the app with the configured admin email.
4. In `backend`, install dependencies and start the API:

   ```sh
   npm install
   npm run dev
   ```

5. In the project root, install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

The Vite server proxies `/api` requests to the backend on port 5000. On its first successful database connection, the backend seeds the sample categories and products if those collections are empty. It creates the configured admin account when both admin environment variables are set.

## Backend

- `backend/models/`: Mongoose models for users, products, categories, and orders
- `backend/routes/`: authentication, product, category, user, and order APIs
- `backend/data/seed.js`: initial catalog and optional admin seed
- `backend/server.js`: Express server and MongoDB connection

Users register and sign in through the API. Passwords are hashed with bcrypt, and protected requests use JWTs. Admin-only API routes manage products, categories, user roles, and order status. Checkout validates product stock and creates orders in MongoDB.

## Notes

The user model uses the `user` collection in the `Apptech` database. Existing browser-only accounts are not imported; users must register again, or the admin can be seeded using the environment variables above. Never commit `.env` or share database credentials. Rotate any credential that has been exposed.

Payments are simulated, and product images use external URLs.# react-practice
