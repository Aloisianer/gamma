import { Readable } from 'stream';
import * as m3u8Parser from 'm3u8-parser';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { trackCache, clientId } from '../../server.js'

export async function convertAndCacheTrack(trackId, hlsTranscoding) {
    try {
        // Fetch HLS playlist
        let playlistUrl = `${hlsTranscoding.url}?client_id=${clientId}`;
        let playlistRes = await fetch(playlistUrl);
        let playlistText = await playlistRes.json();
        let playlistPlaylistRes = await fetch(playlistText.url);
        let playlistPlaylist = await playlistPlaylistRes.text();

        // Parse HLS playlist
        let parser = new m3u8Parser.Parser();
        parser.push(playlistPlaylist);
        parser.end();

        if (!parser.manifest.segments?.length) {
            throw new Error('No segments found in HLS playlist');
        }

        // Cache
        let tempFilePath = path.join(os.tmpdir(), `track-${trackId}.mp3`);
        let writeStream = fs.createWriteStream(tempFilePath);
        let fileSize = 0;

        for (let i = 0; i < parser.manifest.segments.length; i++) {
            let segment = parser.manifest.segments[i];
            let segmentRes = await fetch(segment.uri);
            let arrayBuffer = await segmentRes.arrayBuffer();
            let segmentBuffer = Buffer.from(arrayBuffer);

            if (hlsTranscoding.format.mime_type === 'audio/mpeg') {
                writeStream.write(segmentBuffer);
                fileSize += segmentBuffer.length;
            } else {
                await new Promise((resolve, reject) => {
                    let segmentSize = 0;
                    ffmpeg()
                        .input(Readable.from(segmentBuffer))
                        .audioCodec('libmp3lame')
                        .format('mp3')
                        .on('data', (chunk) => {
                            writeStream.write(chunk);
                            segmentSize += chunk.length;
                        })
                        .on('end', () => {
                            fileSize += segmentSize;
                            resolve();
                        })
                        .on('error', reject)
                        .run();
                });
            }
        }

        writeStream.end();
        await new Promise(resolve => writeStream.on('finish', resolve));

        // Cache metadata
        trackCache.set(trackId, {
            path: tempFilePath,
            size: fileSize,
            contentType: 'audio/mpeg'
        });

        return trackCache.get(trackId);
    } catch (error) {
        console.error('Error converting track:', error);
        throw error;
    }
};

export function handleRangeRequest(req, res, filePath, fileSize) {
    let range = req.headers.range;
    if (!range) {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(filePath).pipe(res);
        return;
    }

    let parts = range.replace(/bytes=/, '').split('-');
    let start = parseInt(parts[0], 10);
    let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
        res.writeHead(416, {
            'Content-Range': `bytes */${fileSize}`
        });
        return res.end();
    }

    let chunkSize = end - start + 1;
    let readStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg'
    });

    readStream.pipe(res);
};