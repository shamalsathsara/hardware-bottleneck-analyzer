/**
 * Safe, repeatable seeding script for Project Aura Game Catalog.
 * Performs non-destructive upserts based on game slug.
 * Usage: node scripts/seedGames.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Game = require('../models/Game');

async function seedGames() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected.');

  try {
    const rawData = fs.readFileSync(path.join(__dirname, '..', 'seeds', 'games.json'), 'utf-8');
    const games = JSON.parse(rawData);

    let inserted = 0;
    let updated = 0;

    for (const gameData of games) {
      const existing = await Game.findOne({ slug: gameData.slug });
      if (existing) {
        await Game.updateOne({ slug: gameData.slug }, { $set: gameData });
        updated++;
      } else {
        await Game.create(gameData);
        inserted++;
      }
    }

    console.log('----------------------------------------------------');
    console.log(`🎮 Game Seeding Complete!`);
    console.log(`   - Inserted: ${inserted}`);
    console.log(`   - Updated:  ${updated}`);
    console.log(`   - Total:    ${games.length}`);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Error seeding games:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

if (require.main === module) {
  seedGames();
}

module.exports = seedGames;
