const fs = require('fs');
const playdl = require('play-dl');
const OpenAI = require('openai');
const { search } = require('yt-search');
const { MessageMedia } = require('whatsapp-web.js');

const openai = new OpenAI({ apiKey: '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' });
const config = require('../src/config/config.json');

class MessageController {
  constructor(model, message, markAsRead, replyMessage) {
    this.model = model;
    this.message = message;
    this.markAsRead = markAsRead;
    this.replyMessage = replyMessage;
  }

  async handleIncomingMessage() {
    const text = this.message.body;
    let url = this.message.body.split(' ')[1];
    let isGroups = this.message.from.endsWith('@g.us');

    if (!isGroups) {
      try {
        if (text != null && (text.startsWith('#search') || text.startsWith('#audio') || text.startsWith('#video'))) {
          if (text.startsWith('#search')) {
            this.replyMessage('[⏳] Loading...');
            const searchTerm = text.substring(8);

            try {
              const searchResults = await search(searchTerm);
              const videoList = searchResults.videos.slice(0, 5);

              if (videoList.length === 0) {
                return this.replyMessage('[❎] No videos found.');
              }

              videoList.forEach(video => {
                this.replyMessage(`*VIDEO DETAILS*
• Title: *${video.title}*
• Duration: *${video.timestamp}*
• Views: *${video.views}*
• URL: *${video.url}*`);
              });
            } catch (err) {
              console.error('Error during YouTube search:', err);
              this.replyMessage('[❎] Search failed.');
            }
          } else {
            if (!url) {
              return this.replyMessage('[❎] Please provide a valid YouTube URL.');
            }

            const isValidUrl = await playdl.validate(url);

            if (!isValidUrl) {
              return this.replyMessage('[❎] Invalid YouTube URL.');
            }

            if (text.startsWith('#audio')) {
              this.downloadMedia(url, 'mp3', 'audioonly');
            } else if (text.startsWith('#video')) {
              this.downloadMedia(url, 'mp4', 'video');
            }
          }
        } else {
          const completion = await openai.chat.completions.create({
            messages: [
              { role: 'system', content: text },
              { role: 'user', content: 'Hello, Eisax' },
            ],
            max_tokens: 50,
            model: 'gpt-3.5-turbo',
          });

          this.replyMessage(completion.choices[0].message.content);
        }

        setTimeout(this.markAsRead, this.runAfter(2000, 5000));
      } catch (error) {
        console.error('Error handling incoming message:', error.message);
      }
    }
  }

  async downloadMedia(url, format, type) {
    try {
      this.replyMessage('[⏳] Downloading...');
      console.log(`Starting ${type} download for: ${url}`);

      const stream = await playdl.stream(url, { quality: type === 'audioonly' ? 2 : 1 });
      const fileName = `./src/database/download.${format}`;
      const writeStream = fs.createWriteStream(fileName);

      stream.stream.pipe(writeStream);

      writeStream.on('finish', async () => {
        console.log(`File saved as ${fileName}`);
        const media = await MessageMedia.fromFilePath(fileName);
        media.filename = `download.${format}`;
        await this.replyMessage(media);
        this.replyMessage('[✅] Successfully downloaded!');
      });

      writeStream.on('error', (err) => {
        console.error('File writing error:', err);
        this.replyMessage('[❎] Download failed.');
      });
    } catch (err) {
      console.error('Error during download:', err);
      this.replyMessage('[❎] Download failed.');
    }
  }


  runAfter(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

module.exports = MessageController;
