const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Custom Middleware for JWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send("Unauthorized access");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

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
    const usersCollection = dbClient.db("ipix").collection("users");

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
        seller_email: productData.seller_email,
        category_id: ObjectId(req.params.cat_id),
        sold: false,
        posted_on: new Date(),
        is_advertised: false,
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

    app.get("/advertised", async (req, res) => {
      const is_advertised = await productCollection
        .find({
          is_advertised: true,
        })
        .toArray();
      res.send(is_advertised);
    });

    app.put("/advertised/:id", async (req, res) => {
      const updatedDoc = await productCollection.updateOne(
        { _id: ObjectId(req.params.id) },
        {
          $set: {
            is_advertised: true,
          },
        }
      );
      res.send(updatedDoc);
    });

    app.get("/myproducts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.send.status(403).send({ message: "forbidden access" });
      }
      const query = { seller_email: email };
      const productsData = await productCollection.find(query).toArray();
      console.log(productsData);
      res.send(productsData);
    });

    /*
     * app.get('/bookings')
     * app.get('/bookings/email=)
     * POST /bookings
     * app.patch('bookings/:id)
     * app.delete('/bookings/:id)
     */

    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { buyers_email: email };
      const bookingsProductData = await bookingProductCollection
        .find(query)
        .toArray();
      res.send(bookingsProductData);
    });

    app.post("/bookings", async (req, res) => {
      let bookingProductData = req.body;

      bookingProductData = {
        ...bookingProductData,
        product_id: ObjectId(bookingProductData.product_id),
      };
      const result = await bookingProductCollection.insertOne(
        bookingProductData
      );
      res.send(result);
    });

    /*
     * POST /users
     * GET /users
     * PUT /users
     * GET /users/:id
     * */

    app.get("/users", async (req, res) => {
      const query = {};
      const cursor = usersCollection.find(query);
      const users = await cursor.toArray();
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      let user = req.body;
      user = {
        ...user,
        verified: false,
      };
      const email = user.email;
      const query = { email };
      const userFindResult = await usersCollection.findOne(query);
      if (!userFindResult) {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } else {
        res.send({});
      }
    });

    app.put("/users/admin/:id", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const userData = await usersCollection.findOne(query);
      res.send({ isAdmin: userData?.role === "admin" });
    });

    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const userData = await usersCollection.findOne(query);
      res.send({ isSeller: userData?.user_type === "seller" });
    });
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const userData = await usersCollection.findOne(query);
      res.send({ isBuyer: userData?.user_type === "buyer" });
    });

    // GET /jwt

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
        // Token generate
        const token = jwt.sign(
          {
            email,
            id: user._id,
          },
          process.env.ACCESS_TOKEN,
          {
            expiresIn: "1h",
          }
        );
        return res.send({ accessToken: token });
      }

      console.log(user);

      res.status(403).send({ accessToken: "" });
    });
  } finally {
  }
}
run().catch((error) => console.error(error));

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`ipix server running on ${port}`);
});
