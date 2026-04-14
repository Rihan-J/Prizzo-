const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('./src/services/jwt.service');
const axios = require('axios');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({where: {email: "superadmin@prizzo.com"}});
  const token = generateToken({ userId: user.id, role: user.role });
  
  try {
    const res = await axios.get('http://localhost:5000/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Failed:", e.response?.status, e.response?.data);
  }
  process.exit(0);
}
check();
