document.getElementById("year").textContent = new Date().getFullYear();

let deferredPrompt = null;
const installButton = document.getElementById("installBtn");
const iosInstall = document.getElementById("iosInstall");
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  if (!standalone) installButton.classList.remove("d-none");
});

installButton.addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.classList.add("d-none");
  } else if (isIOS && !standalone) {
    iosInstall.classList.remove("d-none");
  }
});

if (isIOS && !standalone) installButton.classList.remove("d-none");
document.getElementById("closeIos").onclick = () => iosInstall.classList.add("d-none");

const radioAudio = document.getElementById("radioAudio");
const playerStatus = document.getElementById("playerStatus");
const radioToggle = document.getElementById("radioToggle");
const radioPlayer = radioToggle.closest(".radio-player");
const volumeControl = document.getElementById("volumeControl");

function isInsecureStreamOnSecurePage() {
  const configuredStreamUrl = radioAudio.getAttribute("src") || radioAudio.src;
  return location.protocol === "https:" && new URL(configuredStreamUrl, location.href).protocol === "http:";
}

function showStreamError() {
  playerStatus.textContent = isInsecureStreamOnSecurePage()
    ? "El navegador exige HTTPS en esta página, pero la señal solo ofrece HTTP. Hace falta un relay HTTPS para reproducir aquí."
    : "No se pudo reproducir la señal MP3. Comprueba tu conexión e inténtalo de nuevo.";
}

function updatePlayerState(isPlaying) {
  radioPlayer.classList.toggle("is-playing", isPlaying);
  radioToggle.setAttribute("aria-pressed", String(isPlaying));
  radioToggle.setAttribute("aria-label", isPlaying ? "Pausar La Juca" : "Reproducir La Juca");
}

radioAudio.volume = Number(volumeControl.value);
volumeControl.addEventListener("input", () => {
  radioAudio.volume = Number(volumeControl.value);
});

radioAudio.addEventListener("playing", () => {
  playerStatus.textContent = "Reproduciendo en vivo";
  updatePlayerState(true);
});

radioAudio.addEventListener("waiting", () => {
  playerStatus.textContent = "Conectando con la señal…";
});

radioAudio.addEventListener("pause", () => {
  updatePlayerState(false);
  if (!radioAudio.error) playerStatus.textContent = "En pausa";
});

radioAudio.addEventListener("error", () => {
  updatePlayerState(false);
  showStreamError();
});

radioToggle.addEventListener("click", async () => {
  if (!radioAudio.paused) {
    radioAudio.pause();
    return;
  }

  playerStatus.textContent = "Conectando con la señal…";
  updatePlayerState(true);
  try {
    await radioAudio.play();
  } catch (error) {
    updatePlayerState(false);
    const normalizedName = error && error.name ? error.name : "";
    if (normalizedName === "NotAllowedError") {
      playerStatus.textContent = "El navegador bloqueó el audio. Vuelve a tocar reproducir.";
    } else {
      showStreamError();
    }
  }
});

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}