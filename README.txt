LA JUCA PWA

Sube el CONTENIDO de esta carpeta a public_html.
Requiere HTTPS para PWA/Service Worker.
Android/Chrome/Edge: botón Instalar app cuando el navegador lo permita.
iPhone/iPad: Safari > Compartir > Agregar a pantalla de inicio; el botón muestra esa guía.
El sitio base se cachea, pero el streaming de Listen2MyRadio requiere Internet.
El reproductor usa audio AAC por HTTP. Algunos navegadores/dispositivos pueden no admitir AAC,
y una página HTTPS puede bloquear o actualizar automáticamente una señal HTTP.
Los navegadores también pueden impedir autoplay hasta que el usuario toque Play.
El stream muestra el logo de La Juca como imagen fija; el servidor no ofrece una API CORS
para leer la canción actual y no proporciona carátulas. Para habilitar metadatos y arte,
se requiere una API/proxy HTTPS y una fuente de imágenes de canciones.
