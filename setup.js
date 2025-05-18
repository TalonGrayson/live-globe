const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Setting up the Live Globe application...');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file...');
  fs.writeFileSync(envPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
  console.log('.env file created');
} else {
  console.log('.env file already exists');
}

// Generate Prisma client
console.log('Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully');
} catch (error) {
  console.error('Error generating Prisma client:', error);
  process.exit(1);
}

// Run migrations
console.log('Running database migrations...');
try {
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  console.log('Database migrations completed successfully');
} catch (error) {
  console.error('Error running migrations:', error);
  process.exit(1);
}

// Seed the database
console.log('Seeding the database...');
try {
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  console.log('Database seeded successfully');
} catch (error) {
  console.error('Error seeding database:', error);
  process.exit(1);
}

console.log('Setup completed successfully!');
console.log('You can now run the application with:');
console.log('  npm run dev      # Development server only');
console.log('  npm run dev:full # Development server with API backend'); 