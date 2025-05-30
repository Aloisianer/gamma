import express from 'express';
let port = process.env.PORT || 3000;
import sckey from 'soundcloud-key-fetch';
import { Server } from 'socket.io';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import next from 'next';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { convertAndCacheTrack, handleRangeRequest } from './src/lib/convert-and-cache.js';
import { Track } from './src/classes.js';

ffmpeg.setFfmpegPath(ffmpegPath);

export let trackCache = new Map();
export let clientId;

let app = next({ dev: true, turbopack: true })

let handle = app.getRequestHandler()
app.prepare().then(async () => {
  let server = express();
  let mainServer = createServer(server)

  let socket = new Server(mainServer, {
    cors: {
      origin: "*",
    },
  });

  socket.on('connection', async (socket) => {
    clientId = await sckey.fetchKey();
    let query = "hardcore"
    let amount = "10"
    //if (!query) return res.status(400).send('Missing query');
    let link = `https://api-v2.soundcloud.com/search?q=${query}&facet=model&user_id=6103-34204-861051-537219&client_id=${clientId}&limit=${amount}&offset=0&linked_partitioning=1&app_version=1748345262&app_locale=en`;
    let queryRes = await fetch(link)
    let queryData = await queryRes.json();
    let tracks = []

    queryData.collection.forEach(track => {
      if (track.kind === "track" && track.monetization_model !== 'SUB_HIGH_TIER') {
        let newTrack = new Track(
          track.id,
          track.artwork_url,
          track.title,
          track.user.username,
        )
        tracks.push(newTrack)
      }
    })

    socket.emit('search', tracks)

    socket.on('play', (trackId) => {
      tracks.forEach(track => {
        if (track.id === trackId) {
          socket.emit('playNow', track.id, track.title)
        }
      })
    })
  })

  server.use(bodyParser.json());

  server.get('/api/track', async (req, res) => {
    try {
      let trackId = req.query.id;
      if (!trackId) return res.status(400).send('Missing trackId');

      if (trackCache.has(trackId)) {
        let { path: filePath, size } = trackCache.get(trackId);
        handleRangeRequest(req, res, filePath, size);
        return;
      }

      // Get Track Data
      let trackRes = await fetch(
        `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`
      );
      let trackData = await trackRes.json();

      // Full download
      let progressive = trackData.media?.transcodings?.find(
        t => t.format?.protocol === 'progressive'
      );

      if (progressive) {
        let streamRes = await fetch(`${progressive.url}?client_id=${clientId}`);
        let { url: mp3Url } = await streamRes.json();
        return res.redirect(mp3Url);
      }

      let hlsStreams = trackData.media?.transcodings?.filter(
        t => t.format?.protocol === 'hls'
      );

      if (!hlsStreams?.length) {
        return res.status(404).send('No playable streams found');
      }

      let hlsTranscoding = hlsStreams.find(
        t => t.format.mime_type === 'audio/mpeg'
      ) || hlsStreams[0];

      let { path: filePath, size } = await convertAndCacheTrack(trackId, hlsTranscoding);
      handleRangeRequest(req, res, filePath, size);
    } catch (error) {
      console.error('Track processing error:', error);
      if (!res.headersSent) res.status(500).send('Internal Server Error');
    }
  });

  server.get('/api/search', async (req, res) => {
    try {
      let query = req.query.query
      if (!query) return res.status(400).send('Missing query');
      let queryRes = await fetch(
        `https://api-v2.soundcloud.com/search?q=${query}&facet=model&user_id=6103-34204-861051-537219&client_id=${clientId}&limit=20&offset=0&linked_partitioning=1&app_version=1748345262&app_locale=en`
      )
      let queryData = await queryRes.json();
      let tracks = []
      queryData.collection.forEach(track => {
        if (track.kind === "track" && track.public === true) {
          let newTrack = new Track(
            track.id,
            track.artwork_url,
            track.title,
            track.user.username,
          )
          tracks.push(newTrack)
        }
      })
      res.send(tracks)
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  })

  server.all(/(.*)/, (req, res) => {
    return handle(req, res)
  })

  mainServer.listen(port, () => {
    console.log(` ○ Server listening at http://localhost:${port}`)
  })
})