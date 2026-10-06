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

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}