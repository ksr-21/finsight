import serverlessHttp from 'serverless-http';
import app from '../server';

// Export a Vercel-compatible handler
export default serverlessHttp(app);
