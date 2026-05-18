import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Chat from '../models/chatmodels.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const chats = await Chat.find({}).lean();
    let updated = 0;

    for (const c of chats) {
      let changed = false;
      const messages = (c.message || []).map((m) => {
        // create a shallow copy and remove image/title fields
        const copy = { ...m };
        if (copy.image) {
          delete copy.image;
          changed = true;
        }
        if (copy.title) {
          delete copy.title;
          changed = true;
        }
        return copy;
      });

      if (changed) {
        await Chat.updateOne({ _id: c._id }, { $set: { message: messages } });
        updated++;
        console.log(`Updated chat ${c._id}`);
      }
    }

    console.log(`Migration complete. Chats updated: ${updated}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
};

run();
