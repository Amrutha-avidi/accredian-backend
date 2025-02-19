const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// ✅ Fix 1: Explicitly Handle `OPTIONS` Requests Before Any Routes
app.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  return res.status(204).end(); // Send empty response for preflight
});

// ✅ Fix 2: Proper CORS Configuration
app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend-deployed-url.com"],  // Replace with actual deployed frontend
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());

// ✅ Test Route
app.get("/", (req, res) => {
  res.json({ message: "CORS is enabled!" });
});

// ✅ Main API Route
app.post("/api/referral", async (req, res) => {
  try {
    const { refereeName, refereeEmail, refereePhone, referrerName, referrerEmail, referrerPhone, referredProgram } = req.body;

    if (!refereeName || !refereeEmail || !refereePhone || !referrerName || !referrerEmail || !referrerPhone || !referredProgram) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(refereeEmail) || !emailRegex.test(referrerEmail)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const newReferral = await prisma.referral.create({
      data: { refereeName, refereeEmail, refereePhone, referrerName, referrerEmail, referrerPhone, referredProgram },
    });

    await sendReferralEmail(refereeEmail, referrerName, referredProgram);

    res.status(201).json({ message: "Referral submitted successfully!", data: newReferral });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save referral" });
  }
});

// ✅ Email Function
const sendReferralEmail = async (recipientEmail, referrerName, referredProgram) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: recipientEmail,
    subject: "You've been referred!",
    text: `Hi, you have been referred by ${referrerName} for the ${referredProgram} program. Check it out!`,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
