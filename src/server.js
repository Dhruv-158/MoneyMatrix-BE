import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { startCronJobs } from "./cron/index.js";

const startServer = async () => {
  await connectDb();
  startCronJobs();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
};

startServer();
