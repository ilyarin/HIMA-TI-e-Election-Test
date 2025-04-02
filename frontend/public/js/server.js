const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const csvParser = require("csv-parser");
const cors = require("cors");
const app = express();
const PORT = 5000;
const axios = require("axios");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const EventEmitter = require("events");

const eventEmitter = new EventEmitter();
let isProcessing = false;

// 🔹 Path ke folder script dan CSV
const BASE_DIR = process.cwd(); // Langsung ke root project
const CSV_FILE = path.join(BASE_DIR, "script/voter_passwords_1.csv");
const CSV_FILE_VOTE = path.join(BASE_DIR, "script/voter_data_1.csv");
const FONNTE_API_KEY = "hayoyo"; // Ganti pakai process.env.FONNTE_API_KEY di production

app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const generateRandomPassword = () => crypto.randomBytes(6).toString("hex");

const readCSV = async () => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE_VOTE)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

app.get("/generate-passwords", async (req, res) => {
  try {
    let users = await readCSV();

    if (users.length === 0) {
      return res.json({ success: false, message: "Tidak ada data dalam CSV!" });
    }

    users = users.map((user) => ({
      Name: user.Name,
      "WhatsApp Number": user["WhatsApp Number"],
      Password: generateRandomPassword(),
    }));

    const csvWriterInstance = createCsvWriter({
      path: CSV_FILE,
      header: [
        { id: "Name", title: "Name" },
        { id: "WhatsApp Number", title: "WhatsApp Number" },
        { id: "Password", title: "Password" },
      ],
    });

    await csvWriterInstance.writeRecords(users);

    res.json({
      success: true,
      message: "Password berhasil dibuat!",
      data: users,
    });
  } catch (error) {
    console.error("❌ Error generate password:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal generate password!" });
  }
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readCSV_1 = async () => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

app.get("/send-passwords", async (req, res) => {
  if (isProcessing) {
    return res.json({
      success: false,
      message: "Pengiriman sedang berlangsung, mohon tunggu...",
    });
  }

  isProcessing = true;

  try {
    console.log("🔹 Mulai kirim password...");

    const users = await readCSV_1();

    if (users.length === 0) {
      return res.json({ success: false, message: "Tidak ada data dalam CSV!" });
    }

    let results = [];

    for (const user of users) {
      await delay(Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000); // Delay per user

      const message = `Halo *${user.Name}*, ini adalah password Voting Anda: *${user.Password}* 
Gunakan password ini untuk login dan berikan suara terbaikmu!
Terima kasih Mas/Mbak *${user.Name}*.`;

      try {
        const response = await axios.post(
          "https://api.fonnte.com/send",
          {
            target: user["WhatsApp Number"],
            message: message,
          },
          { headers: { Authorization: FONNTE_API_KEY } }
        );

        const status = response?.data?.status ? "Berhasil" : "Gagal";

        results.push({
          phone: user["WhatsApp Number"],
          status,
        });

        console.log(`✅ ${user["WhatsApp Number"]}: ${status}`);
      } catch (error) {
        results.push({
          phone: user["WhatsApp Number"],
          status: "Gagal",
          error: error.message,
        });

        console.error(
          `❌ Error kirim ke ${user["WhatsApp Number"]}:`,
          error.message
        );
      }
    }

    res.json({
      success: true,
      message: "Pengiriman selesai",
      results,
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  } finally {
    isProcessing = false;
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
