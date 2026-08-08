const path = require('path');
const backendDir = path.join(__dirname, '../../backend');
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });

const mongoose = require(path.join(backendDir, 'node_modules/mongoose'));
const Customer = require(path.join(backendDir, 'src/models/Customer'));
const { customers } = require(path.join(backendDir, 'src/utils/mockData'));

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI missing in backend/.env');
      process.exit(1);
    }
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected! Clearing old mock customer records...');
    await Customer.deleteMany({});
    
    console.log(`Inserting ${customers.length} realistic customer telemetry profiles...`);
    await Customer.insertMany(customers.map(c => ({
      ...c,
      _id: new mongoose.Types.ObjectId()
    })));

    const count = await Customer.countDocuments();
    console.log(`✅ Successfully seeded ${count} customer records into MongoDB Atlas!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
