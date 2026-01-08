// simple hashing to map car number to slot index
// We'll use a deterministic polynomial rolling hash and then mod by total slots

function hashCarToSlot(carNo, totalSlots) {
  if (!carNo) return 0;
  const s = String(carNo).toUpperCase();
  let hash = 0;
  const p = 31;
  const m = 1e9 + 9;
  let power = 1;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i) - 64; // A=1
    hash = (hash + (code * power)) % m;
    power = (power * p) % m;
  }
  return Math.abs(hash) % totalSlots;
}

module.exports = { hashCarToSlot };
