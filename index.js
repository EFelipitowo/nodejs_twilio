const express = require("express");
const app = express();

const Twilio = require('twilio');
const extName = require('ext-name');
const urlUtil = require('url');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const { NODE_ENV } = process.env;
const { MessagingResponse } = Twilio.twiml;

let twilioClient;
let images = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/webhook", function (req, res) {
  console.log("req->", req.body);

  const { body } = req;
  const { NumMedia, From: SenderNumber, MessageSid } = body;
  let saveOperations = [];
  const mediaItems = [];

  for (var i = 0; i < NumMedia; i++) {  
    const mediaUrl = body[`MediaUrl${i}`];
    const type = body[`MediaContentType${i}`];
    const id = req.body.MessageSid;
    const contentType = body[`MediaContentType${i}`];
    const extension = extName.mime(contentType)[0].ext;
    const mediaSid = path.basename(urlUtil.parse(mediaUrl).pathname);
    const filename = `${mediaSid}.${extension}`;

    var afterDot = req.body.Body.substring(req.body.Body.indexOf('.'));
    var num = (contentType.substring(contentType.indexOf('/') + 1));
    console.log(num);
    mediaItems.push({ mediaSid, MessageSid, mediaUrl, filename });

    /*no puede guardar los archivos de office en general(excepto los .csv) ni tampoco arcivhos comprimidos por que a estos no se les 
      asigna una MediaURl, para mas informacion acerca de los datos que soporta revisar en 
      https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
      */
    saveOperations = mediaItems.map(mediaItem => download(mediaItem, id + '.' + num));
  /*
    Aqui nuestro media item es el archivo a descargar, la varia id es el nombre que le puse, aqui al final tiene agregado num que
    le dara la informacion para que se guarde como el tipo de archivo que reconoce twilio, se puede cambiar id por otra cosa
    para dale el nombre, pero siempre se debe dejar el "'.' + num" para quen pueda guarda el achivo con un formato
  */
    console.log('es '+ num);

  }
  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("servidor montado en puerto 3000");
});

async function download(mediaItem, name) {
  const { mediaUrl, filename } = mediaItem;
  if (NODE_ENV !== 'test') {
    const fullPath = path.resolve(__dirname, './images', name);

    if (!fs.existsSync(fullPath)) {
      const response = await fetch(mediaUrl);
      const fileStream = fs.createWriteStream(fullPath);

      response.body.pipe(fileStream);
    }
    images.push(filename);
  }
}

function getTwilioClient() {
  return new Twilio(twilioAccountSid, twilioAuthToken);
}



