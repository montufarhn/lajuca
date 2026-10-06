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
const radioStreamUrl = "http://uk15freenew.listen2myradio.com:36958/stream";

function openRadioStream() {
  if (location.protocol === "file:") {
    playerStatus.textContent = "Abre esta página desde un servidor web o usa la opción de abrir la señal.";
  }
  window.open(radioStreamUrl, "_blank", "noopener,noreferrer");
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
  const error = radioAudio.error;
  if (error && (
    error.code === MediaError.MEDIA_ERR_DECODE ||
    error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
  )) {
    playerStatus.textContent = "Este navegador no admite el formato AAC de la señal. Se abrirá la radio en otra pestaña.";
    openRadioStream();
  } else {
    playerStatus.textContent = "No se pudo cargar la señal. Comprueba la conexión e inténtalo de nuevo.";
  }
});

radioToggle.addEventListener("click", async () => {
  if (!radioAudio.paused) {
    radioAudio.pause();
    return;
  }

  if (location.protocol === "file:") {
    openRadioStream();
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
    } else if (normalizedName === "NotSupportedError" || normalizedName === "AbortError") {
      playerStatus.textContent = "Este navegador no admite esta señal AAC. Se abrirá la radio en otra pestaña.";
      openRadioStream();
    } else {
      playerStatus.textContent = "No se pudo iniciar la señal. Inténtalo de nuevo.";
    }
  }
});

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}