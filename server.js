const express = require('express');
const { createRequestHandler } = require('@remix-run/express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const BUILD_DIR = path.join(process.cwd(), "build");

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// API endpoint to get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// API endpoint to get a specific location by ID
app.get('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

// API endpoint to add a new location
app.post('/api/locations', async (req, res) => {
  const { country, city, pointName, description, latitude, longitude } = req.body;
  
  try {
    const newLocation = await prisma.geoLocation.create({
      data: {
        country,
        city,
        pointName,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      }
    });
    
    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// Remix handler
app.all(
  "*",
  createRequestHandler({
    build: require(BUILD_DIR),
    mode: process.env.NODE_ENV
  })
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 