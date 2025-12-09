// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ใช้ URI ตามที่บอกไว้
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;


// เชื่อมต่อ MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// สร้าง Schema
const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true, unique: true },
  checked: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

// ผูกกับ collection ชื่อ "seats"
const Seat = mongoose.model('Seat', seatSchema, 'seats');

// ดึงข้อมูลที่นั่งทั้งหมด
app.get('/api/seats', async (req, res) => {
  try {
    const seats = await Seat.find({});
    res.json(seats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// อัปเดตสถานะที่นั่ง หรือ ลบถ้า checked = false
app.post('/api/seats/:seatNumber', async (req, res) => {
  try {
    const seatNumber = Number(req.params.seatNumber);
    const { checked } = req.body;

    // ถ้า checked เป็น false ให้ลบ record ออกจากฐานข้อมูล
    if (checked === false) {
      await Seat.deleteOne({ seatNumber });
      return res.json({ seatNumber, deleted: true });
    }

    // ถ้า checked เป็น true ให้บันทึก/อัปเดตตามปกติ
    const seat = await Seat.findOneAndUpdate(
      { seatNumber },
      { checked: true, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json(seat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ล้างสถานะที่นั่งทั้งหมด: ลบทุก document ใน collection
app.post('/api/seats/clear', async (req, res) => {
  try {
    await Seat.deleteMany({});
    res.json({ message: 'cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error' });
  }
});

// รันเซิร์ฟเวอร์
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
