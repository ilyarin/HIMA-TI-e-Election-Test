import { fetchPasswordListFromCSV, sendPasswords } from "./api.js";

document.addEventListener("DOMContentLoaded", function () {
  // 🔹 Load Navbar & Footer jika di landing page (index.html & admin-home.html)
  // Cek apakah halaman yang dibuka adalah index.html & admin-home.html (landing page)
  if (
    window.location.pathname.endsWith("/") ||
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname.endsWith("admin-home.html") ||
    window.location.pathname === "/"
  ) {
    // Load navbar
    fetch("frontend/public/components/navbar.html")
      .then((response) => response.text())
      .then((data) => document.body.insertAdjacentHTML("afterbegin", data));

    // Load footer
    fetch("frontend/public/components/footer.html")
      .then((response) => response.text())
      .then((data) => document.body.insertAdjacentHTML("beforeend", data));
  } else if (
    window.location.pathname.endsWith("/") ||
    window.location.pathname.endsWith("admin-dashboard.html") ||
    window.location.pathname.endsWith("add-candidate.html") ||
    window.location.pathname.endsWith("generate-password.html") ||
    window.location.pathname.endsWith("send-password.html") ||
    window.location.pathname === "/"
  ) {
    // Load navbar
    fetch("../../public/components/admin-navbar.html")
      .then((response) => response.text())
      .then((data) => document.body.insertAdjacentHTML("afterbegin", data));
  }
  // 🔹 Navbar scroll effect
  window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      navbar.classList.toggle("shadow", window.scrollY > 50);
    }
  });

  // 🔹 Smooth scroll untuk anchor link
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // 🔹 Vote button click handler
  const voteButton = document.getElementById("voteButton");
  if (voteButton) {
    voteButton.addEventListener("click", function () {
      const isLoggedIn = false; // Ganti dengan logika login yang benar
      window.location.href = isLoggedIn
        ? "views/students/vote.html"
        : "views/login.html";
    });
  }

  // 🔹 Close navbar menu jika klik di luar
  document.addEventListener("click", function (event) {
    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarMenu = document.querySelector(".navbar-collapse");

    if (
      navbarToggler &&
      navbarMenu &&
      navbarMenu.classList.contains("show") &&
      !event.target.closest(".navbar-toggler, .navbar-collapse")
    ) {
      navbarToggler.click(); // Menutup menu
    }
  });

  // 🔹 Handle Login Form Submission
  document
    .getElementById("loginForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const nim = document.getElementById("nim").value.trim();
      const password = document.getElementById("password").value.trim();

      if (nim === "exampleNIM" && password === "examplePassword") {
        window.location.href = "/views/students/vote.html";
      } else {
        alert("Invalid NIM or Password");
      }
    });

  // ==========================
  // 🔹 Tes Wa Bot Frontend
  // ==========================
  // app.js

  const btnGenerate = document.getElementById("generatePassword");
  const btnSend = document.getElementById("sendPassword");

  const successList = document.getElementById("successList");
  const failedList = document.getElementById("failedList");
  const generatedList = document.getElementById("generatedList");

  const spinner = `<span class="spinner-border spinner-border-sm me-1"></span>`;
  let alertTimeout;

  function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function loadFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  function showAlert(type, message, duration = 5000) {
    const statusMessage = document.getElementById("statusMessage");

    if (alertTimeout) clearTimeout(alertTimeout);

    statusMessage.className = `alert alert-${type} mt-3`;
    statusMessage.innerHTML = message;
    statusMessage.classList.remove("d-none");

    alertTimeout = setTimeout(() => {
      statusMessage.classList.add("d-none");
    }, duration);
  }

  function restoreState() {
    const generatedPasswords = loadFromLocalStorage("generatedPasswords");
    const sendResults = loadFromLocalStorage("sendResults");

    if (generatedPasswords) renderGeneratedPasswords(generatedPasswords);
    if (sendResults) renderSendResults(sendResults);
  }

  restoreState();

  // ==== GENERATE PASSWORD (dari CSV) ====
  btnGenerate.addEventListener("click", async () => {
    btnGenerate.innerHTML = `${spinner} Loading...`;

    try {
      const passwords = await fetchPasswordListFromCSV();

      saveToLocalStorage("generatedPasswords", passwords);
      showAlert("success", "Berhasil ambil password dari CSV!", 10000);
      renderGeneratedPasswords(passwords);
    } catch (error) {
      console.error("Error Generate:", error);
      showAlert("danger", `Gagal ambil password: ${error.message}`, 10000);
    } finally {
      btnGenerate.innerHTML = "Generate Password";
    }
  });

  // ==== SEND PASSWORD ====
  btnSend.addEventListener("click", async () => {
    const confirmSend = confirm("Yakin mau kirim password ke semua user?");
    if (!confirmSend) return;

    btnSend.innerHTML = `${spinner} Sending...`;

    showAlert("info", "Mengirim password... Mohon tunggu.", 5000);

    try {
      const result = await sendPasswords();

      saveToLocalStorage("sendResults", result.results);
      showAlert("success", "Password berhasil dikirim!", 10000);
      renderSendResults(result.results);
    } catch (error) {
      console.error("Error Send:", error);
      showAlert("danger", `Terjadi kesalahan: ${error.message}`, 10000);
    } finally {
      btnSend.innerHTML = "Kirim Password";
    }
  });

  // ==== RENDER HASIL GENERATE ====
  function renderGeneratedPasswords(data = []) {
    generatedList.innerHTML = "";

    // Filter data yang valid (buang yang kosong atau dummy)
    const filteredData = data.filter((user) => {
      const isHeader = user.name === "Name" || user.phone === "WhatsApp Number";
      const isEmpty = !user.name || !user.phone || !user.password;
      return !isHeader && !isEmpty;
    });

    if (!filteredData.length) {
      const emptyItem = document.createElement("li");
      emptyItem.classList.add("list-group-item", "text-muted");
      emptyItem.textContent = "Belum ada data.";
      generatedList.appendChild(emptyItem);
      return;
    }

    // Tampilin data yang udah difilter
    filteredData.forEach((user, index) => {
      const item = document.createElement("li");
      item.classList.add("list-group-item");

      const nama = user?.name || "-";
      const phone = user?.phone || "-";
      const password = user?.password || "-";

      item.innerHTML = `
      <strong>${index + 1}. ${nama}</strong><br/>
      <span class="text-muted">Phone:</span> ${phone}<br/>
      <span class="text-muted">Password:</span> <code class="text-danger">${password}</code>
    `;

      generatedList.appendChild(item);
    });
  }

  // ==== RENDER HASIL KIRIM ====
  function renderSendResults(results = []) {
    successList.innerHTML = "";
    failedList.innerHTML = "";

    if (!results.length) {
      successList.innerHTML = `<li class="list-group-item text-muted">Belum ada data kirim.</li>`;
      failedList.innerHTML = `<li class="list-group-item text-muted">Belum ada data kirim.</li>`;
      return;
    }

    results.forEach((user) => {
      const item = document.createElement("li");
      item.classList.add("list-group-item");

      const nama = user?.name || "Tidak ada nama";
      const nomor = user?.phone || "Tidak ada nomor";

      item.textContent = `${nama} (${nomor})`;

      if (user.status === "Berhasil") {
        successList.appendChild(item);
      } else {
        item.textContent += user.error ? ` - Error: ${user.error}` : "";
        failedList.appendChild(item);
      }
    });

    if (successList.children.length === 0) {
      successList.innerHTML = `<li class="list-group-item text-muted">Tidak ada yang berhasil dikirim.</li>`;
    }

    if (failedList.children.length === 0) {
      failedList.innerHTML = `<li class="list-group-item text-muted">Semua berhasil dikirim.</li>`;
    }
  }
});
