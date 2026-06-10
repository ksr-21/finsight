export const DEFAULT_MONGODB_URI = 'mongodb+srv://finsight_db_user:K1hL9QjvJEuhZOdV@cluster0.p8sqii1.mongodb.net/finsight?appName=Cluster0';
export const DEFAULT_JWT_SECRET = '8c7f3e2a91b4d6f8e5c2a7b9d4f1e8c6a3b5d7f9e2c4a6b8d1f3e5a7c9b2d4f6';

export const config = {
  MONGODB_URI: process.env.MONGODB_URI || DEFAULT_MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
};
