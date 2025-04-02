const BASE_URL = "http://localhost:5000";
const API_KEY = "RahasiaBanget123";

// Fetch CSV file dan parse ke array password
async function fetchPasswordListFromCSV() {
  try {
    const response = await fetch(`${BASE_URL}/passwords.csv`, {
      method: "GET",
      headers: {
        "X-API-KEY": API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal fetch file CSV!");
    }

    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error("API Error (fetchPasswordListFromCSV):", error);
    throw error;
  }
}

// Fungsi parse CSV text ke array of object
function parseCSV(csvText) {
  const rows = csvText
    .split("\n")
    .map((row) => row.trim())
    .filter((row) => row !== "");

  const data = rows.map((row) => {
    const [name, phone, password] = row.split(",");
    return { name, phone, password };
  });

  return data;
}

// Fungsi untuk kirim password (GET request dummy)
async function sendPasswords() {
  try {
    const response = await fetch(`${BASE_URL}/send-passwords`, {
      method: "GET",
      headers: {
        "X-API-KEY": API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error("Gagal mengirim password!");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API Error (sendPasswords):", error);
    throw error;
  }
}

export { fetchPasswordListFromCSV, sendPasswords };
