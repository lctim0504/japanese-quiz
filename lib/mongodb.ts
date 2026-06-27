import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn("MONGODB_URI is not set. Leaderboard API will be disabled.");
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise() {
  if (!uri) {
    return null;
  }

  const client = new MongoClient(uri);

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = client.connect();
    }

    return global._mongoClientPromise;
  }

  return client.connect();
}

const clientPromise = createClientPromise();

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getMongoClient() {
  if (!clientPromise) {
    throw new Error("MONGODB_URI is not configured");
  }

  return clientPromise;
}

export const SCORES_COLLECTION = "quiz_scores";
