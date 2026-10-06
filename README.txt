LA JUCA PWA

Sube el CONTENIDO de esta carpeta a public_html.
Requiere HTTPS para PWA/Service Worker.
Android/Chrome/Edge: botón Instalar app cuando el navegador lo permita.
iPhone/iPad: Safari > Compartir > Agregar a pantalla de inicio; el botón muestra esa guía.
El sitio base se cachea, pero el streaming de Listen2MyRadio requiere Internet.
El reproductor usa el stream MP3 http://uk24freenew.listen2myradio.com:6915/stream y
comienza cuando el usuario toca Play. Los navegadores pueden bloquear una señal HTTP
dentro de la página HTTPS publicada en GitHub Pages. Icecast publica la canción actual
en status.xsl, pero no habilita CORS. Para compatibilidad HTTPS y lectura de metadatos se
requiere un relay HTTPS externo. Las carátulas requieren además una fuente de imágenes.
