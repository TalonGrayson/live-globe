const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    // Clear existing data
    await prisma.geoLocation.deleteMany({});
    
    // Add sample locations
    const locations = [
      {
        country: 'United States',
        city: 'New York',
        pointName: 'Empire State Building',
        description: 'Iconic skyscraper in Midtown Manhattan',
        latitude: 40.7484,
        longitude: -73.9857
      },
      {
        country: 'France',
        city: 'Paris',
        pointName: 'Eiffel Tower',
        description: 'Famous wrought-iron landmark in Paris',
        latitude: 48.8584,
        longitude: 2.2945
      },
      {
        country: 'Japan',
        city: 'Tokyo',
        pointName: 'Tokyo Tower',
        description: 'Communications and observation tower in Tokyo',
        latitude: 35.6586,
        longitude: 139.7454
      },
      {
        country: 'Australia',
        city: 'Sydney',
        pointName: 'Sydney Opera House',
        description: 'Famous performing arts center in Sydney',
        latitude: -33.8568,
        longitude: 151.2153
      },
      {
        country: 'Brazil',
        city: 'Rio de Janeiro',
        pointName: 'Christ the Redeemer',
        description: 'Art Deco statue of Jesus Christ in Rio de Janeiro',
        latitude: -22.9519,
        longitude: -43.2106
      }
    ];
    
    // Insert locations
    for (const location of locations) {
      await prisma.geoLocation.create({
        data: location
      });
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed(); 