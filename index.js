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
    const productCollection = dbClient.db("ipix").collection("products");
    const bookingProductCollection = dbClient.db("ipix").collection("bookings");

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

    /* Products Routes:
        * GET /products
        * POST /products
        
        * GET /products/:id
        * DELETE /products/:id
    */

    app.get("/categories/:cat_id/products", async (req, res) => {
      const categoryId = req.params.cat_id;

      let query = { category_id: ObjectId(categoryId) };
      const cursor = productCollection.find(query);
      const productsData = await cursor.toArray();
      res.send(productsData);
    });

    app.post("/categories/:cat_id/products", async (req, res) => {
      let productData = req.body;
      productData = {
        ...productData,
        seller_id: ObjectId(productData.seller_id),
        category_id: ObjectId(req.params.cat_id),
      };
      const result = await productCollection.insertOne(productData);
      res.send(result);
    });

    app.get("/categories/:cat_id/products/:prod_id", async (req, res) => {
      const query = {
        _id: ObjectId(req.params.prod_id),
      };
      const productData = await productCollection.findOne(query);
      res.send(productData);
    });

    app.delete("/categories/:cat_id/products/:prod_id", async (req, res) => {
      const query = {
        _id: ObjectId(req.params.prod_id),
      };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    /*
     * GET /bookings
     */

    app.post("/bookings", async (req, res) => {
      let bookingProductData = req.body;
      bookingProductData = {
        ...bookingProductData,
        buyer_id: ObjectId(bookingProductData.buyer_id),
        item_id: ObjectId(bookingProductData.item_id),
      };
      const result = await bookingProductCollection.insertOne(
        bookingProductData
      );
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
