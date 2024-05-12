const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
process.stdin.setEncoding("utf8");
app.use(bodyParser.urlencoded({ extended: false }));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
require("dotenv").config();
app.use(express.static(path.join(__dirname)));
const axios = require("axios");
const portNumber = 3000;

const password = process.env.MONGO_DB_PASSWORD;
const username = process.env.MONGO_DB_USERNAME;

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${username}:${password}@cmsc335p5.7b7nlqi.mongodb.net/?retryWrites=true&w=majority&appName=CMSC335P5`;

const databaseAndCollection = {
  db: process.env.MONGO_DB_NAME,
  collection: process.env.MONGO_COLLECTION,
};
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  await client.connect();
  const cursor = client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find({});
  const prospects = await cursor.toArray();
  await client.close();

  let table =
    "<table><tr><th>Name</th><th>Position</th><th>School</th><th>Pro Comp</th></tr>";
  prospects.forEach((p) => {
    table += `<tr><td>${p.name}</td><td>${p.position}</td><td>${
      p.school
    }</td><td><a href="/procomp/${p.name}/${p.procomp}/${p.position}">${p.procomp ?? ""}</a></td></tr>`;
  });
  table += "</table>";

  res.render("index", { table: table });
});

app.get("/addProspect", (req, res) => {
  res.render("addProspect");
});

app.post("/addProspect", async (req, res) => {
  await client.connect();
  await client
    .db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .insertOne(req.body);
  await client.close();
  res.redirect("/");
});

app.get("/procomp/:player/:comp/:position", async (req, res) => {

    const options = {
      method: "GET",
      url: "https://api-american-football.p.rapidapi.com/players",
      params: {
        name: req.params.comp,
      },
      headers: {
        "X-RapidAPI-Key": "8efbf32ca9msh7cd5263e2c8175ep1b2bd1jsn9f767fe74e1c",
        "X-RapidAPI-Host": "api-american-football.p.rapidapi.com",
      },
    };

    try {
      const response = await axios.request(options);
      let data = response.data
      let comp = data.response.find((x) => x.position === req.params.position)
      console.log(comp)
      if (comp){
        comp.player = req.params.player
        res.render("procomp", comp);
      }
      else {throw new Error("no pro comp found")}
    } catch (error) {
      res.redirect('/')
    }
});

app.listen(portNumber);
console.log(`main URL http://localhost:${portNumber}/`);
