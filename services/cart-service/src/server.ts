import "dotenv/config";
import express from "express";
import cors from "cors";
import cartRoutes from "./routes/cart.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", cartRoutes);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4005;
app.listen(PORT, () => {
  console.log(`cart-service running on http://localhost:${PORT}`);
});

