// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors=require('cors');
const app = express();
const port = 3001;
const {Client} =require('@elastic/elasticsearch');
const randomstring = require('randomstring');
const {MongoClient} =require('mongodb');
const PORT=process.env.port || 3001;
const { Vonage } = require('@vonage/server-sdk')

const vonage = new Vonage({
  apiKey: "880b5753",
  apiSecret: "7yxiEbjztoN1uBlx"
})

const from = "LegalEase"


async function sendSMS(to,text) {
    await vonage.sms.send({to, from, text})
        .then(resp => { console.log('Message sent successfully'); console.log(resp); })
        .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
}

// sendSMS();
// Connect to MongoDB (make sure MongoDB is running)
mongoose.connect('mongodb+srv://pranav:PCViditt22$@cluster0.xudkwv8.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// Create a user schema and model
const userSchema = new mongoose.Schema({
  name: String,
  location: String,
  password: String,
  email: String,
  phoneNumber: String,

});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, location, phoneNumber } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user
    const user = new User({ name, email, password: hashedPassword, location, phoneNumber });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route with JWT
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ email:email }, 'secret-key', {
      expiresIn: '1h', // Token expires in 1 hour
    });

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/otpsend', async (req, res) => {
    try {
      const { token } = req.body;
  
      // Verify and decode the JWT token to get the email
      const decodedToken = jwt.verify(token, 'secret-key'); // Replace with your secret key
      const email = decodedToken.email;
  
      // Generate a random 4-digit OTP
      const otp = randomstring.generate({ length: 4, charset: 'numeric' });
  
        const resp=await User.findOne({email});
        const phoneNumber="91"+resp.phoneNumber;
      await sendSMS(phoneNumber,`This is your OTP for LegalEase: ${otp}`);
  
      res.status(201).json({otp:otp});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  
  const client = new Client({
    node: "https://f98b758acb094cd4acba4a96ffea8645.es.us-central1.gcp.cloud.es.io:9243",
    auth: {
      username: "elastic",
      password: "CTk04lGeA9YEH3M8NDu2FtLN",
    },
  });
  
  app.get("/fetchRegistration", async (req, res) => {
    const { registrationID } = req.query;
    console.log(registrationID);
    const query = {
      index: "legaleaseindex",
      query: {
        match: {
          RegistrationID: registrationID,
        },
      },
      size: "1",
    };
  
    try {
      const response = await client.search(query);
      res.json(response.hits.hits[0]._source);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "An error occurred while fetching data" });
    }
  });
  
  app.get("/fetchCaseDetails", async (req, res) => {
    const data = [
      {
        caseNo: "123456",
        clientName: "Rohit Malik",
        clientEmail: "abc@gmail.com",
        clientContact: "9998887771",
        lawyerName: "Narayan",
        lawyerEmail: "xyz@gmail.com",
        lawyerContact: "1112223334",
        locationCourt: "High Court, Delhi",
      },
      {
        caseNo: "12346",
        clientName: "Harsh Malik",
        clientEmail: "abcd@gmail.com",
        clientContact: "9998887771",
        lawyerName: "Narayan",
        lawyerEmail: "xyz@gmail.com",
        lawyerContact: "1112223334",
        locationCourt: "High Court, Delhi",
      },
      {
        caseNo: "323456",
        clientName: "Naman Malik",
        clientEmail: "adc@gmail.com",
        clientContact: "9498887771",
        lawyerName: "Venus",
        lawyerEmail: "xyzi@gmail.com",
        lawyerContact: "1112223334",
        locationCourt: "Supreme Court, Delhi",
      },
    ];
  
    try {
      
      res.status(200).send({
        data:data
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send({ error: "An error occurred while fetching data" });
    }
  });
  app.get("/fetchFeedbacks", async (req, res) => {
    const data=[
      {
        cno:'129987456',
        clientName:'Rohit',
        lawyerName: 'Md. Hakeem',
        lawyerEmail:'md.hakeem@example.com',
        feedback:`Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
        currentRating:'4'
      },
      {
        cno:'129900456',
        clientName:'Harsh',
        lawyerName: 'Ishwar Chand',
        lawyerEmail:'ishwar.c@example.com',
        feedback:`Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
        currentRating:'4.5'
      },
      {
        cno:'129907411',
        clientName:'Viraj',
        lawyerName: 'Md. Hakeem',
        lawyerEmail:'md.hakeem@example.com',
        feedback:`Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.`,
        currentRating:'4'
      },
    ]
     try {
      res.status(200).send({
        data:data
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send({ error: "An error occurred while fetching data" });
    }
  });
  app.post("/updateRating", async (req, res) => {
    
     try {
      res.status(200).send({
        data:data
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send({ error: "An error occurred while fetching data" });
    }
  });
  
  app.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
  });
  
  app.post("/saveappointments", async (req, res) => {
    try {
      const dataArray = req.body; // This is your array of objects
      console.log(dataArray);
  
      // Connect to the MongoDB database
      const client = await MongoClient.connect(
        "mongodb+srv://legalEase:uBR08AiCVFtg2WJd@cluster0.xpnb2yn.mongodb.net/?retryWrites=true&w=majority",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );
  
      const db = client.db("legalEase_1"); // Replace with your database name
      const collection = db.collection("appointments"); // Replace with your collection name
  
      // Insert the array of objects into the MongoDB collection
      const reqArray = await collection.findOne({
        RegistrationID: dataArray["RegistrationID"],
      });
      let nextArray = [];
      if (reqArray) {
        nextArray = reqArray.dates;
      }
  
      for (let index = 0; index < dataArray["dates"].length; index++) {
        const element = dataArray["dates"][index];
        nextArray.push(element);
      }
  
      console.log(nextArray);
  
      let result;
  
      if (reqArray) {
        result = await collection.updateOne(
          { RegistrationID: dataArray["RegistrationID"] },
          {
            $set: { dates: nextArray },
          }
        );
      } else {
        result = await collection.insertOne({
          RegistrationID: dataArray["RegistrationID"],
          dates: nextArray,
        });
      }
  
      client.close();
  
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/getappointments", async (req, res) => {
    try {
      const { registrationID } = req.query;
      console.log(registrationID);
      // Connect to the MongoDB database
      const client = await MongoClient.connect(
        "mongodb+srv://legalEase:uBR08AiCVFtg2WJd@cluster0.xpnb2yn.mongodb.net/?retryWrites=true&w=majority",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );
  
      const db = client.db("legalEase_1"); // Replace with your database name
      const collection = db.collection("appointments"); // Replace with your collection name
  
      // Insert the array of objects into the MongoDB collection
      const result = await collection.findOne({
        RegistrationID: registrationID,
      });
      console.log(result);
      client.close();
  
      res.status(201).json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/getdetails", async (req, res) => {
    try {
      const { email } = req.query;
      const { password } = req.query;
  
      // Connect to the MongoDB database
      const client = await MongoClient.connect(
        "mongodb+srv://legalEase:uBR08AiCVFtg2WJd@cluster0.xpnb2yn.mongodb.net/?retryWrites=true&w=majority",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );
  
      const db = client.db("legalEase_1"); // Replace with your database name
      const collection = db.collection("data"); // Replace with your collection name
      const collection2 = db.collection("logindetails"); // Replace with your collection name
  
      // Insert the array of objects into the MongoDB collection
      const result = await collection.findOne({
        Email: email,
      });
      client.close();
      if (result) {
        const reqRes = await collection2.insertOne({
          Email: email,
          Password: password,
        });
        res.status(201).json(reqRes);
      } else {
        res.status(202).json(result);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.post("/getdetailsAdvocate", async (req, res) => {
    try {
      const { token } = req.body;
  
      // Connect to the MongoDB database
      const client = await MongoClient.connect(
        "mongodb+srv://legalEase:uBR08AiCVFtg2WJd@cluster0.xpnb2yn.mongodb.net/?retryWrites=true&w=majority",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );

      const decodedToken = jwt.verify(token, 'secret-key'); // Replace with your secret key
  
      const db = client.db("legalEase_1"); // Replace with your database name
      const collection = db.collection("data"); // Replace with your collection name
      const collection2 = db.collection("logindetails"); // Replace with your collection name
  
      // Insert the array of objects into the MongoDB collection
      const result = await collection.findOne({
        Email: decodedToken.email,
      });
      client.close();
        
        res.status(201).json(result);
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  app.get("/jwttoken", async (req, res) => {
    try {
      const { email } = req.query;
      const { password } = req.query;
  
      // Connect to the MongoDB database
      const client = await MongoClient.connect(
        "mongodb+srv://legalEase:uBR08AiCVFtg2WJd@cluster0.xpnb2yn.mongodb.net/?retryWrites=true&w=majority",
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      );
  
      const db = client.db("legalEase_1"); // Replace with your database name
      const collection2 = db.collection("logindetails"); // Replace with your collection name
  
      const resp = await collection2.findOne({ Email: email });
      if (resp) {
        if (resp.Password == password) {
          const jsonData = {
            email: email,
            password: password,
          };
          const secretKey =
            "1F04705670DCE21BC524DBF9130423BA99181FA11A3CCBE8D2F740C18BA77CCA";
          const token = jwt.sign(jsonData, secretKey, { expiresIn: "1h" }); // You can set the expiration time as needed
          res.status(201).json(token);
        } else {
          res.status(202).json("Wrong password");
        }
      } else {
        res.status(203).json("Not signed up");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  app.get("/alladvocates", async (req, res) => {
    const { validity } = req.query;

    const query = {
      index: "legaleaseindex",
      body: {
        query: {
          match_all: {}, // Use match_all to match all documents
        },
      },
      size: 50,
    };

  
    try {
      const response = await client.search(query);
      if (validity == "true") {
        let data = [];
        for (let index = 0; index < response.hits.hits.length; index++) {
          const element = response.hits.hits[index];
          data.push({
            name: element._source.Name,
            code:
              String(element._source.Name)[0] + String(element._source.Name)[1],
            img: element._source.Profile,
          });
        }
        res.status(201).json(data);
      } else {
        res.status(201).json(response.hits.hits);
      }
     
      
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "An error occurred while fetching data" });
    }
  });
  
  app.get("/advocatefilter", async (req, res) => {
    const { expgt, explt, rgt } = req.query;
    // Define your filter criteria
    const experienceGreaterThan = expgt; // Example: Experience greater than 5 years
    const experienceLessThan = 9; // Example: Experience less than 10 years
    const ratingGreaterThan = rgt; // Example: Rating greater than 4
  
    // Elasticsearch query
    const reqQuery = {
      bool: {
        must: [
          {
            range: {
              Experience: {
                gt: experienceGreaterThan,
                lt: experienceLessThan,
              },
            },
          },
          {
            range: {
              Ratings: {
                gt: ratingGreaterThan,
              },
            },
          },
        ],
      },
    };
    const query = {
      index: "legaleaseindex",
      body: {
        query: reqQuery,
      },
      size: 50,
    };
  
    try {
      const resp = await client.search(query);
      console.log(expgt, explt, rgt);
      res.status(201).send(resp.hits.hits);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "An error occurred while fetching data" });
    }
  });
  
  app.get("/advocatefilterexp", async (req, res) => {
    const query = {
      index: "legaleaseindex",
      body: {
        query: {
          match_all: {}, // Retrieve all documents
        },
      },
      size: 50,
    };
  
    try {
      const resp = await client.search(query);
      const hits = resp.hits.hits;
  
      // Sort the documents in descending order based on the "Experience" field
      const sortedResults = hits.sort(
        (a, b) => b._source.Experience - a._source.Experience
      );
      res.status(201).send(sortedResults);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "An error occurred while fetching data" });
    }
  });
  
  app.get("/advocatefilterratings", async (req, res) => {
    const query = {
      index: "legaleaseindex",
      body: {
        query: {
          match_all: {}, // Retrieve all documents
        },
      },
      size: 50,
    };
  
    try {
      const resp = await client.search(query);
      const hits = resp.hits.hits;
  
      // Sort the documents in descending order based on the "Experience" field
      const sortedResults = hits.sort(
        (a, b) => b._source.Ratings - a._source.Ratings
      );
      res.status(201).send(sortedResults);
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).json({ error: "An error occurred while fetching data" });
    }
  });
