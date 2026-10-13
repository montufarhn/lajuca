"""La Juca TikTok overlay: servidor local sin dependencias externas."""
import json, os, re, threading, time, urllib.parse, urllib.request, unicodedata
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent
META = Path(os.environ.get('LAJUCA_METADATA', r'C:\LaJuca\metadata.txt'))
PORT = int(os.environ.get('LAJUCA_PORT', '8765'))
lock = threading.Lock()
cache = {'key': None, 'artwork': '', 'album': '', 'source': '', 'checked': 0, 'error': ''}

def normalize(s):
    s = unicodedata.normalize('NFKD', s.casefold())
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in s if not unicodedata.combining(c))).strip()

def request_json(url):
    req = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0 (LaJucaOverlay/2.0)', 'Accept':'application/json'})
    with urllib.request.urlopen(req, timeout=7) as resp:
        return json.load(resp)

def artwork_lookup(artist, title):
    query = urllib.parse.urlencode({'term':f'{artist} {title}', 'entity':'song', 'limit':15, 'country':'us'})
    errors=[]
    try:
        songs = request_json('https://itunes.apple.com/search?' + query).get('results', [])
        def score(song):
            a=normalize(song.get('artistName','')); t=normalize(song.get('trackName',''))
            aa=normalize(artist); tt=normalize(title)
            return (5 if aa and a==aa else 2 if aa and (aa in a or a in aa) else 0) + (6 if tt and t==tt else 3 if tt and (tt in t or t in tt) else 0)
        if songs:
            best=max(songs,key=score)
            if score(best)>=5 and best.get('artworkUrl100'):
                art=best['artworkUrl100'].replace('100x100bb','600x600bb').replace('100x100','600x600')
                return art,best.get('collectionName',''),'iTunes',''
    except Exception as exc:
        errors.append('iTunes: '+str(exc))
    # Segunda fuente: MusicBrainz Cover Art Archive por grabación (si hay release)
    try:
        term = f'recording:"{title}" AND artist:"{artist}"' if artist else f'recording:"{title}"'
        url='https://musicbrainz.org/ws/2/recording/?'+urllib.parse.urlencode({'query':term,'fmt':'json','limit':5})
        recordings=request_json(url).get('recordings',[])
        for recording in recordings:
            for release in recording.get('releases',[])[:3]:
                rid=release.get('id')
                if rid:
                    # La URL de Cover Art Archive sirve como fuente de imagen; el navegador determina si existe.
                    return f'https://coverartarchive.org/release/{rid}/front-500',release.get('title',''),'MusicBrainz',''
    except Exception as exc:
        errors.append('MusicBrainz: '+str(exc))
    return '','','','; '.join(errors) or 'No se encontró carátula para esta canción'

def read_song():
    result={'artist':'','title':'Esperando canción...','album':'','artwork':'','connected':False,'path':str(META),'error':'','source':'','updated':int(time.time())}
    try:
        raw=META.read_bytes()
        if not raw:
            result['error']='El archivo de metadatos está vacío';return result
        content=None
        for encoding in ('utf-8-sig','utf-16','cp1252'):
            try:
                content=raw.decode(encoding);break
            except UnicodeError:pass
        lines=[x.strip().strip('\ufeff') for x in (content or '').splitlines() if x.strip()]
        if not lines:
            result['error']='No hay una línea de canción en metadata.txt';return result
        line=lines[0]
        if ' - ' in line:artist,title=line.split(' - ',1)
        elif ' – ' in line:artist,title=line.split(' – ',1)
        else:artist,title='',line
        artist,title=artist.strip(),title.strip()
        if not title:
            result['error']='No se encontró el título en el archivo';return result
        result.update(artist=artist,title=title,connected=True)
    except OSError as exc:
        result['error']=f'No se puede leer {META}: {exc}';return result
    key=(artist,title)
    with lock:
        if cache['key']!=key or time.time()-cache['checked']>1800:
            # No volver a consultar continuamente si no hay portada
            cache.update(key=key,checked=time.time(),error='')
            art,album,source,error=artwork_lookup(artist,title)
            cache.update(artwork=art,album=album,source=source,error=error)
        result.update(artwork=cache['artwork'],album=cache['album'],source=cache['source'],artwork_error=cache['error'])
    return result

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        if self.path.split('?')[0]=='/api/nowplaying':
            data=json.dumps(read_song(),ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type','application/json; charset=utf-8')
            self.send_header('Cache-Control','no-store, max-age=0')
            self.send_header('Content-Length',str(len(data)))
            self.end_headers();self.wfile.write(data)
        else:super().do_GET()

if __name__=='__main__':
    print('LA JUCA TIKTOK LIVE - v2')
    print('URL: http://127.0.0.1:'+str(PORT))
    print('METADATA: '+str(META))
    print('DIAGNOSTICO: http://127.0.0.1:'+str(PORT)+'/api/nowplaying')
    print('Para detener: Ctrl+C')
    ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
