const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const AVLTree = require('../lib/avl');

// simple in-memory AVL tree to maintain ordering by entry_time
const avl = new AVLTree();

// configuration
const TOTAL_SLOTS = 20; // can be changed

// helper to load existing DB into AVL at startup
function loadAVLFromDB() {
  const rows = db.prepare('SELECT * FROM parked ORDER BY entry_time').all();
  rows.forEach(r => {
    avl.insert(r.entry_time, { car_no: r.car_no, slot: r.slot, entry_time: r.entry_time });
  });
}
loadAVLFromDB();

// park car
router.post('/park', (req, res) => {
  const { car_no } = req.body;
  if (!car_no) return res.status(400).json({ error: 'car_no required' });
  const now = Date.now();

  // assign lowest-numbered free slot (1..TOTAL_SLOTS)
  const getBySlot = db.prepare('SELECT * FROM parked WHERE slot = ?');
  const insert = db.prepare('INSERT INTO parked (car_no, slot, entry_time) VALUES (?, ?, ?)');
  const findByCar = db.prepare('SELECT * FROM parked WHERE car_no = ?').get(car_no);
  if (findByCar) return res.status(400).json({ error: 'already parked' });

  for (let s = 1; s <= TOTAL_SLOTS; s++) {
    const existing = getBySlot.get(s);
    if (!existing) {
      try {
        insert.run(car_no, s, now);
        avl.insert(now, { car_no, slot: s, entry_time: now });
        return res.json({ car_no, slot: s, entry_time: now });
      } catch (err) {
        return res.status(500).json({ error: 'db error', details: err.message });
      }
    }
  }
  return res.status(400).json({ error: 'parking full' });
});

// leave car
router.post('/leave', (req, res) => {
  const { car_no } = req.body;
  if (!car_no) return res.status(400).json({ error: 'car_no required' });
  const find = db.prepare('SELECT * FROM parked WHERE car_no = ?').get(car_no);
  if (!find) return res.status(404).json({ error: 'not found' });
  const del = db.prepare('DELETE FROM parked WHERE car_no = ?');
  del.run(car_no);
  avl.delete(find.entry_time);
  const leftAt = Date.now();
  const durationMs = leftAt - find.entry_time;
  const ticket = computeTicket(find.entry_time, leftAt);
  return res.json({ car_no, slot: find.slot, left_at: leftAt, duration_ms: durationMs, ticket });
});

// list currently parked
router.get('/list', (req, res) => {
  // return sorted by entry_time using AVL inorder
  const arr = avl.inorder();
  return res.json(arr);
});

// status for frontend: slots
router.get('/slots', (req, res) => {
  const rows = db.prepare('SELECT slot, car_no FROM parked').all();
  const map = {};
  rows.forEach(r => map[r.slot] = r.car_no);
  // ensure all slots present
  const slots = [];
  for (let i = 1; i <= TOTAL_SLOTS; i++) {
    slots.push({ slot: i, car_no: map[i] || null });
  }
  res.json({ total: TOTAL_SLOTS, slots });
});

module.exports = router;

// ticket computation: 70rs for first hour, +20 for every additional hour (partial hour rounds up)
function computeTicket(entryTime, exitTime) {
  const ms = Math.max(0, exitTime - entryTime);
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  if (hours <= 1) return { hours, cost: 70 };
  return { hours, cost: 70 + (hours - 1) * 20 };
}

// ticket endpoint
router.get('/ticket', (req, res) => {
  const car_no = req.query.car_no;
  if (!car_no) return res.status(400).json({ error: 'car_no required' });
  const find = db.prepare('SELECT * FROM parked WHERE car_no = ?').get(car_no);
  if (!find) return res.status(404).json({ error: 'not found' });
  const now = Date.now();
  const ticket = computeTicket(find.entry_time, now);
  const durationMs = now - find.entry_time;
  res.json({ car_no, slot: find.slot, entry_time: find.entry_time, duration_ms: durationMs, ticket });
});
