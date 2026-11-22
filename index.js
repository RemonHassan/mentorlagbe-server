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
const applications = database.collection("applications");
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
  const query = {};
  if (req.query) {
    if (req.query.mode) {
      query.mode = req.query.mode;
    }
    if (req.query.level) {
      query.level = req.query.level;
    }
    if (req.query.duration) {
      query.duration = req.query.duration;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { subject: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }
  }

  const cursor = tuitions.find(query);
  const result = await cursor.toArray();
  res.send(result);
});
app.get("/tuitions/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await tuitions.findOne(query);
  res.send(result);
});
// Delete tuition
app.delete("/tuitions/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await tuitions.deleteOne(query);
  res.send(result);
});

// applications related API
app.post("/applications", async (req, res) => {
  const application = req.body;
  const result = await applications.insertOne(application);
  res.send(result);
});
app.get("/applications", async (req, res) => {
  const query = {};
  if (req.query.applicantId) {
    query.userId = req.query.applicantId;
  }
  const cursor = applications.find(query);
  const result = await cursor.toArray();
  res.send(result);
});
app.get("/applications/count", async (req, res) => {
  const query = {};
  if (req.query.applicantId) {
    query.userId = req.query.applicantId;
  }
  const result = await applications.countDocuments(query);
  res.send({ count: result });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
