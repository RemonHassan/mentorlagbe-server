import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import Stripe from "stripe";

const app = express();
const port = process.env.PORT || 4001;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
const payments = database.collection("payments");
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
app.get("/users/:id/premium", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await users.findOne(query, { projection: { premium: 1 } });
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
    if (req.query.teacherId) {
      query.teacherId = req.query.teacherId;
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
  if (req.query.tuitionId) {
    query.tuitionId = req.query.tuitionId;
  }
  const cursor = applications.find(query);
  const result = await cursor.toArray();
  res.send(result);
});
app.patch("/applications/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      status: req.body.status,
    },
  };
  const result = await applications.updateOne(query, updatedDoc);
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
// payments related API
app.post("/payments/checkout-verify", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.send({ success: false, message: "Session ID is required" });
  }
  const { status, payment_status, payment_intent, customer_email, metadata } =
    await stripe.checkout.sessions.retrieve(sessionId);
  if (status === "complete" && payment_status === "paid") {
    const sessionQuery = { sessionId };
    const existingPayment = await payments.findOne(sessionQuery);
    if (existingPayment) {
      return res.send({ success: false, message: "Payment already verified" });
    }
    const payment = {
      sessionId,
      status,
      payment_status,
      payment_intent,
      customer_email,
      payment_date: new Date(),
      userId: metadata.userId,
    };
    const result = await payments.insertOne(payment);
    const query = { _id: new ObjectId(metadata.userId) };
    const updatedDoc = {
      $set: {
        premium: true,
      },
    };
    const updateResult = await users.updateOne(query, updatedDoc);
    res.send({ success: true, result, updateResult });
    return;
  }

  res.send({ success: false, message: "payment failed" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
