const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    // Clear existing data
    await prisma.geoLocation.deleteMany({});
    
    // Add sample locations
    const locations = [
        // North America
        {
          "country": "United States",
          "city": "Washington D.C.",
          "pointName": "Washington D.C. Capital",
          "description": "Capital city of the United States",
          "latitude": 38.8951,
          "longitude": -77.0364,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Canada",
          "city": "Ottawa",
          "pointName": "Ottawa Capital",
          "description": "Capital city of Canada",
          "latitude": 45.4215,
          "longitude": -75.6972,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Mexico",
          "city": "Mexico City",
          "pointName": "Mexico City Capital",
          "description": "Capital city of Mexico",
          "latitude": 19.4326,
          "longitude": -99.1332,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
    
        // South America
        {
          "country": "Brazil",
          "city": "Brasília",
          "pointName": "Brasília Capital",
          "description": "Capital city of Brazil",
          "latitude": -15.7801,
          "longitude": -47.9292,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Argentina",
          "city": "Buenos Aires",
          "pointName": "Buenos Aires Capital",
          "description": "Capital city of Argentina",
          "latitude": -34.6037,
          "longitude": -58.3816,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Peru",
          "city": "Lima",
          "pointName": "Lima Capital",
          "description": "Capital city of Peru",
          "latitude": -12.0464,
          "longitude": -77.0428,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Colombia",
          "city": "Bogotá",
          "pointName": "Bogotá Capital",
          "description": "Capital city of Colombia",
          "latitude": 4.7110,
          "longitude": -74.0721,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Chile",
          "city": "Santiago",
          "pointName": "Santiago Capital",
          "description": "Capital city of Chile",
          "latitude": -33.4489,
          "longitude": -70.6693,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
    
        // Europe
        {
          "country": "United Kingdom",
          "city": "London",
          "pointName": "London Capital",
          "description": "Capital city of the United Kingdom",
          "latitude": 51.5074,
          "longitude": -0.1278,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "France",
          "city": "Paris",
          "pointName": "Paris Capital",
          "description": "Capital city of France",
          "latitude": 48.8566,
          "longitude": 2.3522,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Germany",
          "city": "Berlin",
          "pointName": "Berlin Capital",
          "description": "Capital city of Germany",
          "latitude": 52.5200,
          "longitude": 13.4050,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Italy",
          "city": "Rome",
          "pointName": "Rome Capital",
          "description": "Capital city of Italy",
          "latitude": 41.9028,
          "longitude": 12.4964,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Spain",
          "city": "Madrid",
          "pointName": "Madrid Capital",
          "description": "Capital city of Spain",
          "latitude": 40.4168,
          "longitude": -3.7038,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Russia",
          "city": "Moscow",
          "pointName": "Moscow Capital",
          "description": "Capital city of Russia",
          "latitude": 55.7558,
          "longitude": 37.6173,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Ukraine",
          "city": "Kyiv",
          "pointName": "Kyiv Capital",
          "description": "Capital city of Ukraine",
          "latitude": 50.4501,
          "longitude": 30.5234,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Poland",
          "city": "Warsaw",
          "pointName": "Warsaw Capital",
          "description": "Capital city of Poland",
          "latitude": 52.2297,
          "longitude": 21.0122,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Netherlands",
          "city": "Amsterdam",
          "pointName": "Amsterdam Capital",
          "description": "Capital city of the Netherlands",
          "latitude": 52.3676,
          "longitude": 4.9041,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Belgium",
          "city": "Brussels",
          "pointName": "Brussels Capital",
          "description": "Capital city of Belgium",
          "latitude": 50.8503,
          "longitude": 4.3517,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Sweden",
          "city": "Stockholm",
          "pointName": "Stockholm Capital",
          "description": "Capital city of Sweden",
          "latitude": 59.3293,
          "longitude": 18.0686,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Norway",
          "city": "Oslo",
          "pointName": "Oslo Capital",
          "description": "Capital city of Norway",
          "latitude": 59.9139,
          "longitude": 10.7522,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
    
        // Asia
        {
          "country": "China",
          "city": "Beijing",
          "pointName": "Beijing Capital",
          "description": "Capital city of China",
          "latitude": 39.9042,
          "longitude": 116.4074,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Japan",
          "city": "Tokyo",
          "pointName": "Tokyo Capital",
          "description": "Capital city of Japan",
          "latitude": 35.6762,
          "longitude": 139.6503,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "India",
          "city": "New Delhi",
          "pointName": "New Delhi Capital",
          "description": "Capital city of India",
          "latitude": 28.6139,
          "longitude": 77.2090,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "South Korea",
          "city": "Seoul",
          "pointName": "Seoul Capital",
          "description": "Capital city of South Korea",
          "latitude": 37.5665,
          "longitude": 126.9780,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Thailand",
          "city": "Bangkok",
          "pointName": "Bangkok Capital",
          "description": "Capital city of Thailand",
          "latitude": 13.7563,
          "longitude": 100.5018,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Vietnam",
          "city": "Hanoi",
          "pointName": "Hanoi Capital",
          "description": "Capital city of Vietnam",
          "latitude": 21.0285,
          "longitude": 105.8542,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Indonesia",
          "city": "Jakarta",
          "pointName": "Jakarta Capital",
          "description": "Capital city of Indonesia",
          "latitude": -6.2088,
          "longitude": 106.8456,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Malaysia",
          "city": "Kuala Lumpur",
          "pointName": "Kuala Lumpur Capital",
          "description": "Capital city of Malaysia",
          "latitude": 3.1390,
          "longitude": 101.6869,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Philippines",
          "city": "Manila",
          "pointName": "Manila Capital",
          "description": "Capital city of the Philippines",
          "latitude": 14.5995,
          "longitude": 120.9842,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Singapore",
          "city": "Singapore",
          "pointName": "Singapore Capital",
          "description": "Capital city of Singapore",
          "latitude": 1.3521,
          "longitude": 103.8198,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Israel",
          "city": "Jerusalem",
          "pointName": "Jerusalem Capital",
          "description": "Capital city of Israel",
          "latitude": 31.7683,
          "longitude": 35.2137,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Saudi Arabia",
          "city": "Riyadh",
          "pointName": "Riyadh Capital",
          "description": "Capital city of Saudi Arabia",
          "latitude": 24.7136,
          "longitude": 46.6753,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "United Arab Emirates",
          "city": "Abu Dhabi",
          "pointName": "Abu Dhabi Capital",
          "description": "Capital city of the United Arab Emirates",
          "latitude": 24.4539,
          "longitude": 54.3773,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Turkey",
          "city": "Ankara",
          "pointName": "Ankara Capital",
          "description": "Capital city of Turkey",
          "latitude": 39.9334,
          "longitude": 32.8597,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Iran",
          "city": "Tehran",
          "pointName": "Tehran Capital",
          "description": "Capital city of Iran",
          "latitude": 35.6892,
          "longitude": 51.3890,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
    
        // Africa
        {
          "country": "Egypt",
          "city": "Cairo",
          "pointName": "Cairo Capital",
          "description": "Capital city of Egypt",
          "latitude": 30.0444,
          "longitude": 31.2357,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "South Africa",
          "city": "Pretoria",
          "pointName": "Pretoria Capital",
          "description": "Administrative capital city of South Africa",
          "latitude": -25.7461,
          "longitude": 28.1881,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Nigeria",
          "city": "Abuja",
          "pointName": "Abuja Capital",
          "description": "Capital city of Nigeria",
          "latitude": 9.0765,
          "longitude": 7.3986,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Kenya",
          "city": "Nairobi",
          "pointName": "Nairobi Capital",
          "description": "Capital city of Kenya",
          "latitude": -1.2921,
          "longitude": 36.8219,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Morocco",
          "city": "Rabat",
          "pointName": "Rabat Capital",
          "description": "Capital city of Morocco",
          "latitude": 34.0209,
          "longitude": -6.8416,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Ethiopia",
          "city": "Addis Ababa",
          "pointName": "Addis Ababa Capital",
          "description": "Capital city of Ethiopia",
          "latitude": 9.0320,
          "longitude": 38.7490,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Ghana",
          "city": "Accra",
          "pointName": "Accra Capital",
          "description": "Capital city of Ghana",
          "latitude": 5.6037,
          "longitude": -0.1870,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
    
        // Oceania
        {
          "country": "Australia",
          "city": "Canberra",
          "pointName": "Canberra Capital",
          "description": "Capital city of Australia",
          "latitude": -35.2809,
          "longitude": 149.1300,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "New Zealand",
          "city": "Wellington",
          "pointName": "Wellington Capital",
          "description": "Capital city of New Zealand",
          "latitude": -41.2865,
          "longitude": 174.7762,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Papua New Guinea",
          "city": "Port Moresby",
          "pointName": "Port Moresby Capital",
          "description": "Capital city of Papua New Guinea",
          "latitude": -9.4438,
          "longitude": 147.1803,
          "dateAdded": "2025-05-18T00:00:00Z"
        },
        {
          "country": "Fiji",
          "city": "Suva",
          "pointName": "Suva Capital",
          "description": "Capital city of Fiji",
          "latitude": -18.1416,
          "longitude": 178.4419,
          "dateAdded": "2025-05-18T00:00:00Z"
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