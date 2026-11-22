# RaquelJones · 2026

Aplicación web adaptable a móviles para una gymkana de cumpleaños. El progreso se puede guardar en Google Drive o, para probarla, en el almacenamiento local del navegador.

## Calendario

- Inicio: 25 de noviembre de 2026 a las 15:30, hora peninsular española.
- Las pruebas 1–5 se hacen el 25 de noviembre.
- Las pruebas 6–10 se desbloquean el 26 de noviembre a las 00:00, hora peninsular española.
- La portada muestra el tiempo restante hasta el 27 de noviembre de 2026 a las 00:00, en días, horas y minutos.
- Las pantallas de espera incluyen un acceso para adelantar las pruebas durante la comprobación previa.
- Para saltar las fechas durante las pruebas, abre la aplicación con `?modo=pruebas`, por ejemplo `http://localhost:5512/?modo=pruebas`. Las respuestas siguen validándose y puedes recorrer cada prueba en orden.

## Preparación física

1. **Día 25:** prepara 2020 garbanzos. Pinta letras en diez; incluye las letras de `BESOS` y cinco letras de distracción.
2. Deja el osito blanco en casa de su madre, con el código `97531` detrás.
3. Añade a su calendario una nota para una fecha futura del año que viene con la pista del vasito y el ajo. El código que introducirá es `86420`.
4. Dale a María el puzzle de 1000 piezas y el código `123454321` para que se lo entregue cuando esté montado.
5. **Día 26:** esconde cuatro corazones, cada uno con una adivinanza. Después de que Raquel resuelva las cuatro, pulsa **Continuar** y confirma que las has validado tú.
6. La app propone operaciones de fracciones. Al resolverlas, debe escribir `40.381357, -3.206304`.
7. Deja el código `PAPEL` en el lugar del objeto para que pueda introducirlo al llegar. La pantalla también tendrá un botón para abrir el GPS en el mapa.
8. Prepara Mario Kart en Switch. María dará `123456789` si Raquel gana tres carreras seguidas (la última sin objetos para ninguna) o si se rinde con la frase de la app.
9. Después de la cena, el jurado le dará la palabra `CONFORMES`.

Después del prólogo de Raquel Jones, el orden es: garbanzos y palabra, búsqueda en sus orígenes, la frase de su móvil y el código que le entregas, puzzle de María, corazones validados por ti, coordenadas y código `PAPEL`, Mario Kart y cena. Son 10 pasos dentro de la app porque el recuento y la palabra de los garbanzos tienen respuestas separadas. Al introducir `CONFORMES`, aparece el mensaje final sobre el regalo junto a los cascos de la moto.

## Probar en local

Desde esta carpeta:

```powershell
python -m http.server 5512
```

Abre `http://localhost:5512/?modo=pruebas`. El modo de pruebas omite las fechas, pero conserva la intro y hay que pulsar **Comenzar aventura**. Para empezar de nuevo, usa **Reiniciar pruebas**. En modo local, el avance se guarda automáticamente en ese navegador.

Si el navegador dice que no puede cargar la página, deja abierta la terminal donde arrancaste el servidor y comprueba que muestra `Serving HTTP on`. No abras `index.html` como archivo. Si el puerto 5512 ya está ocupado, inicia el servidor con `python -m http.server 5513` y usa `http://localhost:5513/?modo=pruebas`.

## Google Drive

La conexión usa el mismo cliente OAuth, permisos, archivo JSON y copias rotativas que `PROGRAMA_WEB_COMIDAS`. Al conectar, la app usa la carpeta `PROGRAMA_RAQUEL_JONES` que se configuró en Drive y crea dentro el archivo `raquel_cumple_2026_progreso.json`. Las partidas en Drive se guardan al pulsar **Guardar**; se conserva un máximo de cinco copias.

El cliente OAuth debe tener autorizados el origen `https://swimpiii.github.io` y `http://localhost:5512`. La cuenta autorizada necesita acceso a Drive. Si Google Cloud mantiene el consentimiento en modo de prueba, añade esa cuenta a la lista de usuarios de prueba.

## Publicar en GitHub Pages

El workflow de esta carpeta despliega el contenido del directorio como sitio cuando sus archivos estén en la raíz del repositorio `Raquel_Jones`. En GitHub, habilita **Settings → Pages → Build and deployment → Source: GitHub Actions**. La URL será `https://swimpiii.github.io/Raquel_Jones/`.

Antes de publicar la versión final, quita `?modo=pruebas` del enlace. La cuenta atrás y el bloqueo de las coordenadas se aplicarán automáticamente. Mantén sincronizados los relojes de los dispositivos: los desbloqueos se basan en la fecha y hora del móvil.

## Privacidad y límites

Es una aplicación estática sin contraseña para jugar. El acceso de adelanto es solo una comodidad de pruebas, no una protección: como el repositorio `SwimPiii/Raquel_Jones` es público, la clave de adelanto, las respuestas y las coordenadas son visibles en el código fuente. Los cambios hechos en Drive no se mezclan automáticamente si se juega a la vez desde varios dispositivos.
