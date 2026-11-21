import express from "express";
import cors from "cors";
// import { MongoClient, ObjectId } from "mongodb";
// import "dotenv/config";
// import Stripe from "stripe";

const app = express();
const port = process.env.PORT || 4001;

// middlewear
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello mentorlagbee!");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
