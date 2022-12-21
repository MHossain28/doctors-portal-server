const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.td9wdol.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const appointmentOptionCollection = client
      .db("doctorsPortal")
      .collection("appoinmentOptions");

    const bookingCollection = client.db("doctorsPortal").collection("bookings");

    app.get("/appointmentOptions", async (req, res) => {
      const date = req.query.date;
      const query = {};
      const options = await appointmentOptionCollection.find(query).toArray();
      // get the booking of the provided date
      const bookingQuery = { appoinmentDate: date };
      const alreadyBooked = await bookingCollection
        .find(bookingQuery)
        .toArray();

      // code id
      options.forEach((option) => {
        const optionBooked = alreadyBooked.filter(
          (book) => book.teratment === option.name
        );
        const bookedSlots = optionBooked.map((book) => book.slot);
        const remainingSlots = option.slots.filter(
          (slot) => !bookedSlots.includes(slot)
        );
        console.log("asdfg_", remainingSlots);
        option.slots = remainingSlots;
        console.log(date, option.name, remainingSlots.length);
      });
      res.send(options);
    });

    // booking
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        appoinmentDate: booking.appoinmentDate,
        email: booking.email,
        teratment: booking.teratment,
      };

      const alreadyBooked = await bookingCollection.find(query).toArray();
      if (alreadyBooked.length) {
        const message = `You already have booking on ${booking.appoinmentDate}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("doctor server is running");
});

app.listen(port, () => console.log(`doctor portal running ${port}`));
