import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URI

/**
 * Globally-cached connection. Survives Next.js HMR (in dev) and the
 * serverless invocation re-use pattern (in prod).
 *
 * Critically, if a connection attempt FAILS we null the promise back
 * out so the *next* request retries from scratch. The original
 * implementation held the rejected promise forever — a single cold-
 * start network blip wedged every subsequent route handler until the
 * server restarted, presenting as the production-only "This page
 * couldn't load" screen.
 */
let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    }
}

export const connectDB = async () => {
    if (!MONGODB_URL) {
        throw new Error('MONGODB_URI is not configured in the environment.')
    }
    if (cached.conn) return cached.conn

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URL, {
                dbName: process.env.MONGODB_DB_NAME || 'YT-NEXTJS-ECOMMERCE',
                bufferCommands: false,
                // Fail fast on bad networks instead of hanging the request.
                serverSelectionTimeoutMS: 10_000,
                socketTimeoutMS: 45_000,
            })
            .catch((err) => {
                // Critical: clear the cached promise so the next call retries.
                cached.promise = null
                throw err
            })
    }

    try {
        cached.conn = await cached.promise
    } catch (err) {
        // Belt-and-suspenders — same guarantee even if .catch above raced.
        cached.promise = null
        throw err
    }

    return cached.conn
}
