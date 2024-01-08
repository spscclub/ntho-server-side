const express = require('express');
const cors = require('cors');
const qrCode = require('qrcode');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('NTHO server is runing')
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ydunwkf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const adminsCollection = client.db('nthoDB').collection('admins');
    const usersCollection = client.db('nthoDB').collection('users');
    const registrationsCollection = client.db('nthoDB').collection('registrations');



    // user data post
    app.post('/users', async (req, res) => {
      const user = req.body;
      const existingUser = await usersCollection.findOne({ userEmail: user.userEmail });
      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }
      const result = await usersCollection.insertOne(user);
      res.send(result)
    });



    // get all data users  and registrations
    app.get('/allData', async (req, res) => {
    const registrationsData = await registrationsCollection.find().toArray();
    const usersData = await usersCollection.find().toArray();
    res.send({registrationsData, usersData});
    });


    //   user status approved
    app.patch('/user/approved/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                status: 'approved'
            },
        };

        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      })


    //  registration status approved
    app.patch('/registration/approved/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                registrationStatus: 'approved'
            },
        };

        const result = await registrationsCollection.updateOne(filter, updateDoc);
        res.send(result);
      })



    // get one data users  and registrations
    app.get('/auth/:email', async (req, res) => {
        const email = req.params.email;
        if (!email) {
          res.send([])
        }
        const myRegistrationsData = await registrationsCollection.find({ userEmail: email }).toArray();
        const myUserData = await usersCollection.find({ userEmail: email }).toArray();
        res.send({myRegistrationsData, myUserData})
      });


    // get one data users  and registrations
    app.get('/user/:email', async (req, res) => {
        const email = req.params.email;
        if (!email) {
          res.send([])
        }
        const myRegistrationsData = await registrationsCollection.find({ userEmail: email }).toArray();
        const myUserData = await usersCollection.find({ userEmail: email }).toArray();
        res.send({myRegistrationsData, myUserData})
    });

    // put (update) users Status data
    app.put('/user/:email', async(req, res)=>{
        const email = req.params.email;
        if (!email) {
          res.send([])
        }
        const userStatus = req.body;
        console.log(userStatus);
        const filter = { userEmail: email };
        const options = { upsert: true };
        const updateStatus ={
            $set:{
                status: userStatus.status,
            }
        };
        const result = await usersCollection.updateOne(filter,updateStatus,options);
        res.send(result)
    });




    // one user data get
    app.get('/user', async (req, res) => {
      const email = req.query.email;
      const result = await usersCollection.findOne({ userEmail: email });
      res.send(result)
    });


    // admins data post
    app.post('/admins', async (req, res) => {
        const registrationInfo = req.body;
        const result = await adminsCollection.insertOne(registrationInfo);
        res.send(result)
      });



    // registration data post
    app.post('/registration', async (req, res) => {
      const registrationInfo = req.body;
      const result = await registrationsCollection.insertOne(registrationInfo);
      res.send(result)
    });

    // user specific data get
    app.get('/registrations', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      }
      const cursor = registrationsCollection.find({ userEmail: email });
      const result = await cursor.toArray()
      res.send(result)
    });

    // registrations detail get
    app.get('/registrations/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await registrationsCollection.findOne(filter)
      res.send(result)
    });

    // put (update) Registrations Status data
    app.put('/registration/:email', async(req, res)=>{
        const email = req.params.email;
        if (!email) {
            res.send([])
        }
        const statusRegistration = req.body;
        const filter = { userEmail: email };
        const options = { upsert: true };
        const updateStatus ={
            $set:{
                registrationStatus: statusRegistration.registrationStatus,
            }
        };
        const result = await registrationsCollection.updateOne(filter,updateStatus,options);
        res.send(result)
    });


    // qr code generate
    app.get('/qrCode/:userId', async (req, res) => {
      try {
        const userId = req.params.userId;
        const user = await usersCollection.findOne({_id: new ObjectId(userId)});

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const userEmail = user.userEmail;

        // Generate QR code with the user's email
        const qrImage = await qrCode.toDataURL(userEmail);
        res.send(qrImage);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
      }
    });

    //admin role check
     // check role admin or instructor with jwt
  //    app.get('/users/admin/:email', async (req, res) => {
  //     const email = req.params.email;
  //     const query = { email: email }
  //     const user = await usersCollection.findOne(query);
  //     const result = { admin: user?.role === 'admin' }
  //     res.send(result);
  // })


    // // get users one data from mongodb database
    // app.get('/users/:id', async(req, res)=>{
    //     const id = req.params.id;
    //     const filter = {_id: new ObjectId(id)}
    //     const result = await usersCollection.findOne(filter)
    //     res.send(result)
    // })


    // // get users all data from mongodb database
    // app.get('/registrations', async(req, res)=>{
    //     const cursor = registrationsCollection.find();
    //     const result = await cursor.toArray()
    //     res.send(result)
    // });





    // get registrations one data from mongodb database

    // get registations one data from mongodb database. filter by email
    // app.get('/registations/:email', async(req, res)=>{
    //     const email = req.params.email;
    //     const filter = { email: email.toString()}
    //     const result = await registationsCollection.findOne(filter)
    //     res.send(result)
    // })
    // get registations one data from mongodb database. filter by email
    // Assuming you have a MongoDB client initialized (e.g., MongoClient) and a database connection established

    // app.get('/registations/:email', async(req, res)=>{
    //     const email = req.params.email;
    //     // if(!email){
    //     //     res.send([]);
    //     // };
    //     const qurey = {userEmail: email};
    //     const result = registationsCollection.find(qurey).toArray();
    //     res.send(result)
    // });

    // Define the collection you want to query









    // User login Data Post


    // User registations data Post
    // app.post('/registations', async(req, res)=>{
    //     const user = req.body;
    //     const result = await registationsCollection.insertOne(user);
    //     res.send(result)
    // })

    // User data update (put)
    // app.put('/users/:id', async(req, res) =>{
    //     const id = req.params.id
    //     const user = req.body;
    //     const filter = {_id: new ObjectId(id)}
    //     const options = {upsert: true};
    //     const updateUser = {
    //         $set:{
    //             name: user.name,
    //             dateOfBirth: user.dateOfBirth,
    //             district: user.district,
    //             clas: user.clas,
    //             institute: user.institute,
    //             category: user.category,
    //             translationID: user.translationID,
    //             senderNumber: user.senderNumber,
    //             receiverNumber: user.receiverNumber,
    //             refer: user.refer
    //         }
    //     };
    //     const result = await usersCollection.updateOne(filter,updateUser,options);
    //     res.send(result)
    // } )


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);




app.listen(port, (req, res) => {
  console.log('Server Port number', port);
})