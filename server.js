const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173"], // Allow Vite frontend
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
})); 
app.use(express.json());
// const allowedOrigins = [
//   "http://localhost:5173", // Vite Development Server
//   "http://localhost:3000", // React Default Dev Server (if used)
//   "https://your-frontend-domain.com" // Replace with your deployed frontend URL
// ];

// Save Referral Data
app.post("/api/referral", async (req, res) => {
  try {
    const { refereeName, refereeEmail, refereePhone, referrerName, referrerEmail, referrerPhone, referredProgram } = req.body;

    //  Validate Required Fields**
    if (!refereeName || !refereeEmail || !refereePhone || !referrerName || !referrerEmail || !referrerPhone || !referredProgram) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Validate Email Format**
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(refereeEmail) || !emailRegex.test(referrerEmail)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Save to Database
    const newReferral = await prisma.referral.create({
      data: { refereeName, refereeEmail, refereePhone, referrerName, referrerEmail, referrerPhone, referredProgram },
    });

    // Send Email Notification
    await sendReferralEmail(refereeEmail, referrerName, referredProgram);

    res.status(201).json({ message: "Referral submitted successfully!", data: newReferral });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save referral" });
  }
});

//Email Notification Function
const sendReferralEmail = async (recipientEmail, referrerName, referredProgram) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
      user: process.env.EMAIL,  // Your Gmail
      pass: process.env.EMAIL_PASS,  // Your App Password
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

app.get("/", (req, res) => res.json("Prisma working"))  // Test GET route

// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
