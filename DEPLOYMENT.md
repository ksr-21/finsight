# Vercel Deployment Guide

To deploy FinSight AI to Vercel with a MongoDB backend, follow these steps:

## 1. MongoDB Setup
1. Create a MongoDB Atlas account at [mongodb.com](https://www.mongodb.com/cloud/atlas).
2. Create a new Project and a Cluster (the free shared tier works great).
3. Under "Database Access", create a user with "Read and write to any database" permissions.
4. Under "Network Access", add `0.0.0.0/0` (Allow Access from Anywhere) to ensure Vercel can connect.
5. Get your connection string (usually looks like `mongodb+srv://<username>:<password>@cluster0.p8sqii1.mongodb.net/finsight?appName=Cluster0`).

## 2. Vercel Configuration
1. Install Vercel CLI: `npm i -g vercel`.
2. Run `vercel` in your project root to link the project.
3. During setup, choose "Vite" as the preset.

## 3. Environment Variables
Add the following variables in the Vercel Dashboard (Settings > Environment Variables):
- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: A long, random string for secure token generation.
- `VITE_OPENROUTER_API_KEY`: (Optional) Your OpenRouter API key for AI features.

## 4. Deployment
1. Push your changes to GitHub and connect your repository to Vercel for automatic deployments.
2. Alternatively, run `vercel --prod` to deploy manually.

The `vercel.json` file is already configured to handle routing for both the React frontend (SPA) and the serverless backend functions in the `api/` folder.
