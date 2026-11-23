(() => {
  "use strict";
  const base = "https://montuhn.tail06d51a.ts.net:10000";
  const $ = id => document.getElementById(id);
  const audio = $("jucaAudio"), play = $("jucaPlay"), quality = $("jucaQuality"), status = $("jucaStatus");
  const logo = new URL("assets/logo-la-juca.png", document.baseURI).href;
  let hls, wanted = false, generation = 0, retry, watchdog, mode = "", failures = 0;
  const native = !!audio.canPlayType("application/vnd.apple.mpegurl");
  function clear() { clearTimeout(retry); clearTimeout(watchdog); }
  function reset() { clear(); if (hls) { hls.destroy(); hls = null; } audio.pause(); audio.removeAttribute("src"); audio.load(); }
  function label(s) { status.textContent = s; play.textContent = wanted ? "Detener" : "▶ Escuchar"; play.setAttribute("aria-pressed", String(wanted)); }
  function fail(g) {
    if (!wanted || g !== generation) return;
    ++generation; reset();
    if (mode !== "mp3") { start(true); return; }
    failures++;
    label("Señal interrumpida. Reconectando…");
    $("jucaBackup").open = true;
    retry = setTimeout(() => { if (wanted) start(false); }, Math.min(30000, 3000 * failures));
  }
  function start(forceMP3 = false) {
    const g = ++generation; reset();
    const q = quality.value;
    const url = base + "/hls/la_juca/" + (q === "auto" ? "live" : "aac_" + q) + ".m3u8";
    mode = forceMP3 || q === "mp3" || (!native && !(window.Hls && Hls.isSupported())) ? "mp3" : "hls";
    label("Conectando…");
    const begin = () => {
      if (!wanted || g !== generation) return;
      audio.play().catch(e => {
        if (g !== generation || !wanted) return;
        if (e.name === "NotAllowedError") { stop(); label("Pulsa Escuchar para iniciar."); }
        else if (e.name !== "AbortError") fail(g);
      });
    };
    watchdog = setTimeout(() => fail(g), 20000);
    if (mode === "mp3" || native) { audio.src = mode === "mp3" ? base + "/radio.mp3" : url; begin(); }
    else {
      hls = new Hls({enableWorker:true, lowLatencyMode:false});
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) fail(g); });
      hls.on(Hls.Events.MEDIA_ATTACHED, () => { if (g === generation) hls.loadSource(url); });
      hls.on(Hls.Events.MANIFEST_PARSED, begin);
      hls.attachMedia(audio);
      begin();
    }
  }
  function stop() { wanted = false; ++generation; reset(); label("Listo para escuchar"); }
  play.addEventListener("click", () => { if (wanted) stop(); else { wanted = true; failures = 0; start(); } });
  quality.addEventListener("change", () => { if (wanted) start(); });
  audio.addEventListener("playing", () => { if (!wanted) return; clear(); failures = 0; label(mode === "mp3" ? "En vivo · MP3 192 kbps" : "En vivo · HLS"); });
  for (const event of ["waiting","stalled"]) audio.addEventListener(event, () => { if (!wanted || retry) return; label("Cargando audio…"); clearTimeout(watchdog); const g = generation; watchdog = setTimeout(() => fail(g), 20000); });
  audio.addEventListener("error", () => { if (wanted && audio.error && audio.getAttribute("src")) fail(generation); });
  $("jucaVolume").addEventListener("input", e => { audio.volume = Number(e.target.value); });
  $("jucaBackup").addEventListener("toggle", () => {
    if (!$("jucaBackup").open) return;
    if (!$("jucaBackupScript")) { const s = document.createElement("script"); s.id = "jucaBackupScript"; s.src = "https://cdn.cloud.caster.fm//widgets/embed.js"; document.body.append(s); }
  });
  $("jucaBackup").addEventListener("click", e => { if (e.target.closest("summary") && !$("jucaBackup").open) stop(); });
  if ("mediaSession" in navigator) {
    for (const [action, handler] of [["play", () => { wanted = true; start(); }], ["pause", stop], ["stop", stop]]) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (_) {}
    }
  }
  let artworkKey = null;
  async function metadata() {
    try {
      const response = await fetch(base + "/api/nowplaying/la_juca", {cache:"no-store", signal:AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined});
      if (!response.ok) throw Error("metadata");
      const data = await response.json(), song = data.now_playing?.song || {};
      $("jucaTitle").textContent = song.title || song.text || "La Juca";
      $("jucaArtist").textContent = song.artist || "Radio online";
      const key = JSON.stringify([song.artist,song.title,song.album]);
      if (key !== artworkKey) {
        artworkKey = key;
        $("jucaArt").src = logo;
        const updateMedia = art => {
          if ("mediaSession" in navigator && window.MediaMetadata) navigator.mediaSession.metadata = new MediaMetadata({title:song.title || "La Juca",artist:song.artist || "Radio online",artwork:[{src:art}]});
        };
        updateMedia(logo);
        if (window.JucaArtwork) window.JucaArtwork.search(song).then(art => {
          if (key !== artworkKey || !art) return;
          $("jucaArt").src = art;
          updateMedia(art);
        }).catch(() => {});
      }
    } catch (_) { $("jucaArtist").textContent = "Radio online · Metadatos no disponibles"; }
  }
  $("jucaArt").addEventListener("error", () => { if ($("jucaArt").src !== logo) $("jucaArt").src = logo; });
  metadata(); setInterval(metadata,15000);
})();