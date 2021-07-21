const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const redis = require("redis");
const { promisify } = require("util");
const { Queue, Worker } = require('bullmq');

const client = redis.createClient();

const hgetAsync = promisify(client.hget).bind(client);
const hsetAsync = promisify(client.hset).bind(client);
const hdelAsync = promisify(client.hdel).bind(client);

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

const validatorRequestQ = new Queue('validatorRequestQ');

const app = express();
app.use(bodyParser.json());

app.post('/api/signup', async function (req, res) {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await mongoose.connection.collection('user').insertOne({ username, password: hashedPassword });
    return res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/signin', async function (req, res) {
  try {
    const { username, password } = req.body;
    const requests = await getAsync('requests');
    await setAsync('requests', (parseInt(requests) || 0) + 1);
    if (requests && parseInt(requests) % 5 === 0) {
      return res.json({ success: false, message: 'Too much load on system' });
    }
    const id = nanoid();
    await validatorRequestQ.add('request', { id, username, password });
    return res.json({ success: true, message: 'Login request submitted', data: { id } });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/signin/:id', async function (req, res) {
  try {
    const { id } = req.params;
    const data = await hgetAsync('validation', id);
    if (!data) {
      return res.json({ success: false, error: 'Validaion still in progress ' });
    }
    const { username, password, success } = JSON.parse(data);
    await hdelAsync('validation', id);
    if (success) {
      const user = await mongoose.connection.collection('user').findOne({ username });
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        return res.json({ success: true, message: 'Login successful' });
      } else {
        return res.json({ success: false, error: 'Invalid password' });
      }
    } else {
      return res.json({ success: false, error: 'Validaion failied' });
    }
    return res.json({ success: true, message: 'Login request submitted', data: { id } });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, error: error.message });
  }
})

mongoose.createConnection(process.env.MONGO_URI || 'mongodb://localhost:27017/auth', { useNewUrlParser: true, useUnifiedTopology: true }).then((connection) => {
  mongoose.connection = connection;
  app.listen(process.env.PORT || 3030, () => console.log(`server running on port ${process.env.PORT || 3030}`));
}).catch((err) => {
  console.log(err);
  console.error('Unable to connect to DB');
});

new Worker('validatorResponseQ', async ({ name, data }) => {
  try {
    await hsetAsync('validation', data.id, JSON.stringify(data));
  } catch (error) {
    console.log(error);
    throw error;
  }
});
