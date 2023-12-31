const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const db = require('./config/connection');
const config = require('./config/config'); // Import your Last.fm API key
const bcrypt = require('bcrypt');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorMiddleware');
const jwt = require('jsonwebtoken')
const secretKey = (process.env.JWT_SECRET);
const routes = require('./routes');
const { ApolloServer } = require('apollo-server-express');
const { typeDefs, resolvers } = require('./schemas');
const { authMiddleware } = require('./utils/auth');



// Import Route Handlers
const { artistRoutes, searchRoutes } = require('./controllers');

const app = express();
const PORT = process.env.PORT || 3001;

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: authMiddleware,
});


app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/users', require('./routes/api/userRoutes.js'))

app.use(express.static(path.join(__dirname, '../client/build')))
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build'))
})


// Last.fm API key
const lastFMAPIKey = config.lastFMAPIKey;


app.use(routes);

// Search route
app.get('/search', async (req, res) => {
  const searchTerm = req.query.q;

  try {
    // Search Last.fm for artist information
    const lastfmResponse = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'artist.search',
        artist: searchTerm,
        api_key: lastFMAPIKey,
        format: 'json',
      },
    });

    // Check if the Last.fm API response contains 'artistmatches'
    if (!lastfmResponse.data.results || !lastfmResponse.data.results.artistmatches) {
      return res.status(404).json({ message: 'No results found.' });
    }

    // Extract relevant data from the Last.fm response
    const searchResults = lastfmResponse.data.results.artistmatches.artist;

    if (searchResults.length === 0) {
      return res.status(404).json({ message: 'No results found.' });
    }

    // Extract artist names
    const artistNames = searchResults.map((result) => result.name);

    // Respond with artist names
    res.json({ artistNames });
  } catch (error) {
    console.error('Last.fm API Error:', error);
    return res.status(500).json({ message: 'Error fetching Last.fm data.' });
  }
});

// app.use('/album', albumRoutes);
app.use('/artists', artistRoutes);
app.use('/search-results', searchRoutes);
// app.use('/songs', songRoutes);





app.post('/users', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { name: req.body.name, password: hashedPassword };
        users.push(user);
        res.status(201).send();
    } catch {
        res.status(500).send();
    }
});


// Put this into a database
const users = [];

 app.get('/users', (req, res) => {
     res.json(users);
 });

 app.post('/users', async (req, res) => {
     try {
         const hashedPassword = await bcrypt.hash(req.body.password, 10);
         const user = { name: req.body.name, password: hashedPassword };
         users.push(user);
         res.status(201).send();
     } catch {
         res.status(500).send()
     }
 });

 app.post('/users/login', async (req, res) => {
     const user = users.find(user => user.name === req.body.name)
     if (user == null) {
         return res.status(400).send('Cannot find user')
     }
     try {
        if (await bcrypt.compare(req.body.password, user.password)) {
         res.send('Success')
        } else {
         res.send('Not Allowed')
        }
     } catch {
         res.status(500).send()
     }
 })

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async () => {
  await server.start();
  server.applyMiddleware({ app });
  
  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}!`);
      console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
    })
  })
  };
  
// Call the async function to start the server
startApolloServer();
