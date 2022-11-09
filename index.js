const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});

// verify jwt
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      res.status(401).send({ message: "Token not valid" });
    }
    req.decoded = decoded;
    next();
  });
};

// mongodb connect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nk3n7xe.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const serviceCollection = client.db("footea").collection("services");
    const reviewsCollection = client.db("footea").collection("reviews");

    // get services
    app.get("/services", async (req, res) => {
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = serviceCollection.find(query).sort({ date: -1 });
      if (size) {
        const services = await cursor.limit(size).toArray();
        res.send(services);
        return;
      }
      const services = await cursor.toArray();
      res.send(services);
    });

    // get single service
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
      console.log(id);
    });

    // insert service
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // get reviews by id
    app.get("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { serviceId: id };
      const cursor = reviewsCollection.find(query).sort({ date: -1 });
      const reviews = await cursor.toArray();
      res.send(reviews);
      console.log(id);
    });

    // insert review
    app.post("/reviews", async (req, res) => {
      const user = req.body;
      const result = await reviewsCollection.insertOne(user);
      res.send(result);
    });

    // get my reviews
    app.get("/myreviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      const email = req.query.email;
      if (decoded.email !== email) {
        return res.status(403).send({ message: "Email not valid" });
      }
      const query = { email: email };
      const cursor = reviewsCollection.find(query).sort({ date: -1 });
      const myReviews = await cursor.toArray();
      res.send(myReviews);
    });

    // delete review
    app.delete("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    // update review

    app.put("/myreviews/:id", async (req, res) => {
      const id = req.params.id;
      const review = req.body;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          review: review.review,
        },
      };
      const result = await reviewsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send({ result });
    });

    // jwt sign
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN);
      res.send({ token });
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server is running from port ${port}`);
});
