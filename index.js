const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ status: "success" });
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qkzu9ty.mongodb.net/?retryWrites=true&w=majority`;
const dbClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = dbClient.db("ipix").collection("categories");

    /* Category Routes :
        * GET /categories
        * POST /categories
        
        * GET /categories/:id
        * DELETE /categories/:id
    */
    app.get("/categories", async (req, res) => {
      const query = {};
      const cursor = categoryCollection.find(query);
      const categories = await cursor.toArray();
      res.send(categories);
    });

    app.post("/categories", async (req, res) => {
      const categoryData = req.body;
      const result = await categoryCollection.insertOne(categoryData);
      res.send(result);
    });

    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const categoryData = await categoryCollection.findOne(query);
      res.send(categoryData);
    });

    app.delete("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((error) => console.error(error));

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`ipix server running on ${port}`);
});
