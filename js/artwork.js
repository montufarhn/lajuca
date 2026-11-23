/* External artwork lookup for a static website. */
window.JucaArtwork = (() => {
  const cache = new Map();
  const normalize = s => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
  const quote = s => '"' + String(s).replace(/[\\"]/g, "\\$&") + '"';
  let lastRequest = 0;
  async function search(song) {
    const key = [song.artist,song.title,song.album].map(normalize).join("|");
    if (!song.artist || !song.title) return null;
    if (cache.has(key)) return cache.get(key);
    const task = (async () => {
      const wait = Math.max(0, 1200 - (Date.now() - lastRequest));
      lastRequest = Date.now() + wait;
      if (wait) await new Promise(r => setTimeout(r,wait));
      const query = "recording:" + quote(song.title) + " AND artist:" + quote(song.artist);
      const url = "https://musicbrainz.org/ws/2/recording/?fmt=json&limit=10&query=" + encodeURIComponent(query);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(url,{signal:controller.signal,credentials:"omit"});
        if (!response.ok) return null;
        const data = await response.json();
        const releases = [];
        for (const rec of data.recordings || []) {
          const artist = (rec["artist-credit"] || []).map(a => a.name || a.artist?.name || "").join(" ");
          if (normalize(rec.title) !== normalize(song.title) || normalize(artist) !== normalize(song.artist)) continue;
          for (const release of rec.releases || []) {
            if (release.id) releases.push(release);
          }
        }
        releases.sort((a,b) => Number(normalize(b.title) === normalize(song.album)) - Number(normalize(a.title) === normalize(song.album)));
        const candidates = [...new Set(releases.map(r => r.id))].slice(0,4);
        for (const id of candidates) {
          const art = "https://coverartarchive.org/release/" + encodeURIComponent(id) + "/front-250";
          if (await available(art)) return art;
        }
        return null;
      } catch (_) { return null; } finally { clearTimeout(timer); }
    })();
    cache.set(key,task);
    if (cache.size > 100) cache.delete(cache.keys().next().value);
    return task;
  }
  function available(url) {
    return new Promise(resolve => {
      const img = new Image();
      const timer = setTimeout(() => finish(false),5000);
      function finish(ok) { clearTimeout(timer); img.onload = img.onerror = null; resolve(ok); }
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = url;
    });
  }
  return {search};
})();