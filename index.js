import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
// import Stripe from "stripe";

const app = express();
const port = process.env.PORT || 4001;

const client = new MongoClient(
  `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ac-3aksxmj-shard-00-00.p2ehjyi.mongodb.net:27017,ac-3aksxmj-shard-00-01.p2ehjyi.mongodb.net:27017,ac-3aksxmj-shard-00-02.p2ehjyi.mongodb.net:27017/?ssl=true&replicaSet=atlas-hic49m-shard-0&authSource=admin`,
);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const connectedClient = await connectToMongoDB();
const database = connectedClient.db("mentorlagbedb");
const users = database.collection("user");
const tuitions = database.collection("tuitions");
// middlewear
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello mentorlagbee!");
});
// USERS
app.get("/users", async (req, res) => {
  const cursor = users.find({});
  const result = await cursor.toArray();
  res.send(result);
});
// TUition related API
app.post("/tuitions", async (req, res) => {
  const tuition = req.body;
  const result = await tuitions.insertOne(tuition);
  res.send(result);
});
app.get("/tuitions", async (req, res) => {
  const cursor = tuitions.find({});
  const result = await cursor.toArray();
  res.send(result);
});
// Delete tuition
app.delete("/tuitions/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await tuitions.deleteOne(query);
  res.send(result);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
