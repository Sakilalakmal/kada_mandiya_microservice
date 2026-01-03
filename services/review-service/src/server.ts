import "dotenv/config";
import express from "express";
import cors from "cors";
import reviewRoutes from "./routes/review.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", reviewRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4007;
app.listen(PORT, () => {
  console.log(`review-service running on http://localhost:${PORT}`);
});

