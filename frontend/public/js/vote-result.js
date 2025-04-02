document.addEventListener("DOMContentLoaded", function () {
  // Data hasil pemilihan
  const suaraCalon1 = 96214691;
  const suaraCalon2 = 27040878;
  const suaraCalon3 = 40971906;
  const totalSuara = suaraCalon1 + suaraCalon2 + suaraCalon3;

  // Hitung persentase
  const persenCalon1 = ((suaraCalon1 / totalSuara) * 100).toFixed(1);
  const persenCalon2 = ((suaraCalon2 / totalSuara) * 100).toFixed(1);
  const persenCalon3 = ((suaraCalon3 / totalSuara) * 100).toFixed(1);

  // Update teks jumlah suara
  document.getElementById("count-calon-1").textContent = suaraCalon1;
  document.getElementById("count-calon-2").textContent = suaraCalon2;
  document.getElementById("count-calon-3").textContent = suaraCalon3;

  // Update progress bar dengan animasi
  setTimeout(() => {
    document.getElementById("progress-calon-1").style.width =
      persenCalon1 + "%";
    document.getElementById("progress-calon-2").style.width =
      persenCalon2 + "%";
    document.getElementById("progress-calon-3").style.width =
      persenCalon3 + "%";

    document.getElementById("percent-calon-1").textContent = persenCalon1 + "%";
    document.getElementById("percent-calon-2").textContent = persenCalon2 + "%";
    document.getElementById("percent-calon-3").textContent = persenCalon3 + "%";
  }, 500);

  // Perbaikan Pie Chart menjadi Setengah Lingkaran
  const ctx = document.getElementById("chartHasil").getContext("2d");
  new Chart(ctx, {
    type: "doughnut", // Gunakan doughnut untuk efek cincin
    data: {
      labels: ["Calon 1", "Calon 2", "Calon 3"],
      datasets: [
        {
          data: [suaraCalon1, suaraCalon2, suaraCalon3],
          backgroundColor: ["green", "blue", "red"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Pastikan tidak terdistorsi
      aspectRatio: 2, // Setengah lingkaran
      rotation: -90, // Mulai dari atas
      circumference: 180, // Hanya setengah lingkaran
      animation: {
        duration: 1500,
        easing: "easeOutBounce",
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
    },
  });
});
