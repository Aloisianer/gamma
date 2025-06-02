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

const serverEnv = process.env.SERVER !== 'true';

let app = next({ dev: serverEnv, turbopack: true })

let handle = app.getRequestHandler()

async function validateImage(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.startsWith("image")) {
      return "REPLACE";
    } else {
      return url;
    }
  } catch (error) {
    return "REPLACE";
  }
}

function newTrack(track) {
  if (track.kind === "track" && track.monetization_model !== 'SUB_HIGH_TIER') {
    let newTrack = new Track(
      "track",
      track.id,
      `/api/image?id=${track.id}`,
      track.title,
      track.user.username,
      `/track?id=${track.id}`
    )
    return newTrack
  } else if (track.kind === "track" && track.monetization_model === 'SUB_HIGH_TIER') {
    let newTrack = new Track(
      "track",
      track.id,
      `/api/image?id=${track.id}`,
      "GO+ | " + track.title,
      track.user.username,
      `/track?id=${track.id}`
    )
    return newTrack
  } else if (track.kind === "user") {
    let newTrack = new Track(
      "user",
      track.id,
      `/api/image-user?id=${track.id}`,
      track.full_name,
      track.username,
      `/user?id=${track.id}`
    )
    return newTrack
  } else if (track.kind === "playlist") {
    let newTrack = new Track(
      "playlist",
      track.id,
      `/api/image?id=${track.id}`,
      track.title,
      track.user.username,
      `/playlist?id=${track.id}`
    )
    return newTrack
  } else {
    let newTrack = new Track(
      "unknown",
      Math.floor(10000 + Math.random() * 90000),
      `/api/image?id=${track.id}`,
      "This Element is not yet supported",
      track.kind,
    )
    return newTrack
  }
}

app.prepare().then(async () => {
  let server = express();
  let mainServer = createServer(server)
  clientId = await sckey.fetchKey();

  let socket = new Server(mainServer, {
    cors: {
      origin: "*",
    },
  });

  socket.on('connection', async (socket) => {
    socket.on('playlistNext', () => {
      socket.emit('playNow', 746275300, "234234124")
    })

    socket.on('playlistPrevious', () => {
      socket.emit('playNow', 1994809703, "xn88ax - Fuck It Up Now")
    })

    socket.on('play', (trackId, trackTitle) => {
      socket.emit('playNow', trackId, trackTitle)
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

    server.get('/api/track-info', async (req, res) => {
    try {
      let trackId = req.query.id;
      if (!trackId) return res.status(400).send('Missing trackId');

      let trackRes = await fetch(
        `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`
      );
      let trackData = await trackRes.json();
      res.json(trackData)
    } catch (error) {
      console.error('Track processing error:', error);
      if (!res.headersSent) res.status(500).send('Internal Server Error');
    }
  });
  
  server.get('/api/image', async (req, res) => {
    try {
      let trackId = req.query.id;
      if (!trackId) return res.status(400).send('Missing trackId');

      let trackRes = await fetch(
        `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`
      );
      let trackData = await trackRes.json();
      let artwork = await validateImage(trackData.artwork_url)
      if (artwork !== "REPLACE") {
        res.redirect(artwork)
      } else {
        res.status(404).send("404 Not Found")
      }
    } catch (error) {
      console.error('Track processing error:', error);
      res.status(404).send("404 Not Found")
    }
  });

    server.get('/api/image-big', async (req, res) => {
    try {
      let trackId = req.query.id;
      if (!trackId) return res.status(400).send('Missing trackId');

      let trackRes = await fetch(
        `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`
      );
      let trackData = await trackRes.json();
      let artwork = await validateImage(trackData.artwork_url)
      artwork = await artwork.replaceAll('large', 't500x500')
      if (artwork !== "REPLACE") {
        res.redirect(artwork)
      } else {
        res.status(404).send("404 Not Found")
      }
    } catch (error) {
      console.error('Track processing error:', error);
      res.status(404).send("404 Not Found")
    }
  });

  server.get('/api/image-user', async (req, res) => {
    try {
      let trackId = req.query.id;
      if (!trackId) return res.status(400).send('Missing trackId');

      let trackRes = await fetch(
        `https://api-v2.soundcloud.com/users/${trackId}?client_id=${clientId}`
      );
      let trackData = await trackRes.json();
      let artwork = await validateImage(trackData.avatar_url)
      if (artwork !== "REPLACE") {
        res.redirect(artwork)
      } else {
        res.status(404).send("404 Not Found")
      }
    } catch (error) {
      console.error('Track processing error:', error);
      res.status(404).send("404 Not Found")
    }
  });

  server.get('/api/search', async (req, res) => {
    try {
      let query = req.query.query
      let amount = req.query.amount
      let page = req.query.page
      if (!query) return res.status(400).send('Missing query');
      if (!amount) return res.status(400).send('Missing amount');
      if (!page) return res.status(400).send('Missing page');

      let currentUrl = `https://api-v2.soundcloud.com/search?q=${query}&facet=model&user_id=6103-34204-861051-537219&limit=${amount}&offset=0&linked_partitioning=1&app_version=1748345262&app_locale=en`
      let accumulatedData;

      for (let i = 0; i < page; i++) {
        try {
          const response = await fetch(`${currentUrl}&client_id=${clientId}`);

          if (!response.ok) {
            res.status(response.status).send(response.text())
            return;
          }

          const data = await response.json();

          if (i === page - 1) {
            accumulatedData = data;
          } else {
            currentUrl = data.next_href;
          }
        } catch (error) {
          console.error(`Error on fetch ${i + 1}:`, error);
          return;
        }
      }

      let tracks = []
      
      accumulatedData.collection.forEach(track => {
        tracks.push(newTrack(track))
      })
      res.send({
        "page": page,
        "tracks": tracks
      })
    } catch (error) {
      console.log(error)
      res.status(500).send('Internal Server Error');
    }
  })

    server.get('/api/user-likes', async (req, res) => {
    try {
      let id = req.query.id
      let amount = req.query.amount
      let page = req.query.page
      if (!id) return res.status(400).send('Missing id');
      if (!amount) return res.status(400).send('Missing amount');
      if (!page) return res.status(400).send('Missing page');

      let currentUrl = `https://api-v2.soundcloud.com/users/${id}/likes?limit=${amount}&linked_partitioning=1`
      let accumulatedData;

      for (let i = 0; i < page; i++) {
        try {
          const response = await fetch(`${currentUrl}&client_id=${clientId}`);

          if (!response.ok) {
            res.status(response.status).send(response.text())
            return;
          }

          const data = await response.json();

          if (i === page - 1) {
            accumulatedData = data;
          } else {
            currentUrl = data.next_href;
          }
        } catch (error) {
          console.error(`Error on fetch ${i + 1}:`, error);
          return;
        }
      }

      let tracks = []
      
      accumulatedData.collection.forEach(track => {
        track = track.track
        tracks.push(newTrack(track))
      })
      res.send({
        "page": page,
        "tracks": tracks
      })
    } catch (error) {
      console.log(error)
      res.status(500).send('Internal Server Error');
    }
  })

    server.get('/api/user-playlists', async (req, res) => {
    try {
      let id = req.query.id
      let amount = req.query.amount
      let page = req.query.page
      if (!id) return res.status(400).send('Missing id');
      if (!amount) return res.status(400).send('Missing amount');
      if (!page) return res.status(400).send('Missing page');

      let currentUrl = `https://api-v2.soundcloud.com/users/${id}/playlists?limit=${amount}&linked_partitioning=1`
      let accumulatedData;

      for (let i = 0; i < page; i++) {
        try {
          const response = await fetch(`${currentUrl}&client_id=${clientId}`);

          if (!response.ok) {
            res.status(response.status).send(response.text())
            return;
          }

          const data = await response.json();

          if (i === page - 1) {
            accumulatedData = data;
          } else {
            currentUrl = data.next_href;
          }
        } catch (error) {
          console.error(`Error on fetch ${i + 1}:`, error);
          return;
        }
      }

      let tracks = []
      
      accumulatedData.collection.forEach(track => {
        tracks.push(newTrack(track))
      })
      res.send({
        "page": page,
        "tracks": tracks
      })
    } catch (error) {
      console.log(error)
      res.status(500).send('Internal Server Error');
    }
  })

    server.get('/api/user-tracks', async (req, res) => {
    try {
      let id = req.query.id
      let amount = req.query.amount
      let page = req.query.page
      if (!id) return res.status(400).send('Missing id');
      if (!amount) return res.status(400).send('Missing amount');
      if (!page) return res.status(400).send('Missing page');

      let currentUrl = `https://api-v2.soundcloud.com/users/${id}/tracks?limit=${amount}&linked_partitioning=1`
      let accumulatedData;

      for (let i = 0; i < page; i++) {
        try {
          const response = await fetch(`${currentUrl}&client_id=${clientId}`);

          if (!response.ok) {
            res.status(response.status).send(response.text())
            return;
          }

          const data = await response.json();

          if (i === page - 1) {
            accumulatedData = data;
          } else {
            currentUrl = data.next_href;
          }
        } catch (error) {
          console.error(`Error on fetch ${i + 1}:`, error);
          return;
        }
      }

      let tracks = []
      
      accumulatedData.collection.forEach(track => {
        track = track.track
        tracks.push(newTrack(track))
      })
      res.send({
        "page": page,
        "tracks": tracks
      })
    } catch (error) {
      console.log(error)
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