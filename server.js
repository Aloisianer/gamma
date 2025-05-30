let express = require('express');
let port = process.env.PORT || 3000;
let sckey = require('soundcloud-key-fetch');
let { Server } = require('socket.io');
let { createServer } = require('http');
let bodyParser = require('body-parser');
let next = require('next');
let ffmpeg = require('fluent-ffmpeg');
let ffmpegPath = require('ffmpeg-static');
let { Readable } = require('stream');
let m3u8Parser = require('m3u8-parser');
ffmpeg.setFfmpegPath(ffmpegPath);

let { Track } = require('./src/classes')

let app = next({ dev: true, turbopack: true })

let handle = app.getRequestHandler()
app.prepare().then(async () => {
  let server = express();
  let mainServer = createServer(server)

  socket = new Server(mainServer, {
    cors: {
      origin: "*",
    },
  });

  socket.on('connection', async (socket) => {
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
      let clientId = await sckey.fetchKey();

  server.get('/api/track_old', async (req, res) => {
      try {
          let trackId = req.query.id;
          if (!trackId) return res.status(400).send('Missing trackId');
          let trackRes = await fetch(
              `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`
          );
          let trackData = await trackRes.json();
          let streamUrl = trackData.media?.transcodings
              ?.find(t => t.format?.protocol === 'progressive')?.url;
          if (!streamUrl) return res.status(404).send('MP3 stream not found');
          let streamRes = await fetch(`${streamUrl}?client_id=${clientId}`);
          let { url: mp3Url } = await streamRes.json();
          res.redirect(mp3Url);
      } catch (error) {
          res.status(500).send('Internal Server Error');
      }
  });

  server.get('/api/track', async (req, res) => {
    try {
      let trackId = req.query.id;
      if (!trackId) return res.status(400).send('Missing trackId');
      let trackRes = await fetch(
        `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`
      );
      let trackData = await trackRes.json();
      let progressive = trackData.media?.transcodings?.find(
        t => t.format?.protocol === 'progressive'
      );
      if (progressive) {
        let streamRes = await fetch(`${progressive.url}?client_id=${clientId}`);
        let { url: mp3Url } = await streamRes.json();
        return res.redirect(mp3Url);
      }
      // HLS to MP3
      let hlsStreams = trackData.media?.transcodings?.filter(
        t => t.format?.protocol === 'hls'
      );

      if (!hlsStreams?.length) {
        return res.status(404).send('No playable streams found');
      }

      // Select best HLS stream (prefer existing MP3 streams)
      let hlsTranscoding = hlsStreams.find(
        t => t.format.mime_type === 'audio/mpeg'
      ) || hlsStreams[0];

      // Fetch HLS playlist
      let playlistUrl = `${hlsTranscoding.url}?client_id=${clientId}`;
      let playlistRes = await fetch(playlistUrl);
      let playlistText = await playlistRes.json();
      let playlistPlaylistRes = await fetch(playlistText.url);
      let playlistPlaylist = await playlistPlaylistRes.text()

      // Parse HLS playlist
      let parser = new m3u8Parser.Parser();
      parser.push(playlistPlaylist);
      parser.end();

      if (!parser.manifest.segments?.length) {
        return res.status(404).send('No segments found in HLS playlist: ' + parser.manifest);
      }

      let baseUrl = new URL(playlistUrl);
      baseUrl.pathname = baseUrl.pathname.split('/').slice(0, -1).join('/');

      // Create concatenated stream
      res.setHeader('Content-Type', 'audio/mpeg');
      let audioStream = new Readable({ read() { } });

      let processSegment = async (segment, index) => {
        try {
          let segmentRes = await fetch(segment.uri);

          if (!segmentRes.ok) {
            throw new Error(`Failed to fetch segment: ${segmentRes.status} ${segmentRes.statusText}`);
          }

          let arrayBuffer = await segmentRes.arrayBuffer();
          let segmentBuffer = Buffer.from(arrayBuffer);

          if (hlsTranscoding.format.mime_type === 'audio/mpeg') {
            audioStream.push(segmentBuffer);
          } else {
            // Convert to MP3 using FFmpeg
            await new Promise((resolve, reject) => {
              ffmpeg()
                .input(Readable.from(segmentBuffer))
                .audioCodec('libmp3lame')
                .format('mp3')
                .on('data', chunk => audioStream.push(chunk))
                .on('end', resolve)
                .on('error', reject)
                .run();
            });
          }

          if (index === parser.manifest.segments.length - 1) {
            audioStream.push(null);
          }
        } catch (error) {
          console.error(`Error processing segment ${index}:`, error);
          if (!res.headersSent) res.status(500).send('Segment processing error');
        }
      };

      for (let i = 0; i < parser.manifest.segments.length; i++) {
        await processSegment(parser.manifest.segments[i], i);
      }

      audioStream.pipe(res);

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
    console.log(`Server listening at http://localhost:${port}`)
  })
})