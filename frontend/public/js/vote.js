// Set countdown to 12 hours from now
const countDownDate = new Date().getTime() + 12 * 60 * 60 * 1000;

// Update countdown every second
const countDownTimer = setInterval(function () {
  const now = new Date().getTime();
  const distance = countDownDate - now;

  const hours = Math.floor(distance / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById("countdown").innerHTML =
    (hours < 10 ? "0" + hours : hours) +
    ":" +
    (minutes < 10 ? "0" + minutes : minutes) +
    ":" +
    (seconds < 10 ? "0" + seconds : seconds);

  if (distance < 0) {
    clearInterval(countDownTimer);
    document.getElementById("countdown").innerHTML = "Waktu Habis";
  }
}, 1000);
