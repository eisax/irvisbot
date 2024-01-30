const fs = require('fs');
const ytdl = require('ytdl-core');
const axios = require('axios');
const OpenAI = require('openai');
const { search } = require('yt-search');
const { MessageMedia } = require('whatsapp-web.js');

const openai = new OpenAI({ apiKey: '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' });
const config = require('../src/config/config.json');
// const audioPath =
// const videoPath = 
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
    let isGroups = this.message.from.endsWith('@g.us') ? true : false;

    if (!isGroups) {
      try {
        // const response = await this.model.sendMessage(text);
        if (text != null && (text.startsWith('#search') || text.startsWith('#audio') || text.startsWith('#video'))) {
          if (text.startsWith('#search')) {
            this.replyMessage('[⏳] Loading..');
            let searchTerm = text.substring(8);
            search(searchTerm, async (err, res) => {
              if (err) return console.log(err);

              let videoList = res.videos.slice(0, 5);

              for (let video of videoList) {
                try {
                  let info = await ytdl.getInfo(video.url);
                  let data = {
                    "channel": {
                      "name": info.videoDetails.author.name,
                      "user": info.videoDetails.author.user,
                      "channelUrl": info.videoDetails.author.channel_url,
                      "userUrl": info.videoDetails.author.user_url,
                      "verified": info.videoDetails.author.verified,
                      "subscriber": info.videoDetails.author.subscriber_count
                    },
                    "video": {
                      "title": info.videoDetails.title,
                      "description": info.videoDetails.description,
                      "lengthSeconds": info.videoDetails.lengthSeconds,
                      "videoUrl": info.videoDetails.video_url,
                      "publishDate": info.videoDetails.publishDate,
                      "viewCount": info.videoDetails.viewCount
                    }
                  };


                  this.replyMessage(`*VIDEO DETAILS*\n• Title : *${data.video.title}*\n• Time : *${data.video.lengthSeconds > 60 ? ((data.video.lengthSeconds) / 60).toFixed(2) + ' minutes' : data.video.lengthSeconds + ' seconds'}*\n• Viewers : *${data.video.viewCount}*\n• Channel : *${data.channel.name}*\n• Verified : *${data.channel.verified}*\n• VideoURL : *${data.video.videoUrl}*`);

                } catch (err) {
                  console.log(err);
                  this.replyMessage('*[❎]* Failed to retrieve details for a video!');
                }
              }
            });

            this.replyMessage(`To download on Whatsapp *${this.model.config.name}*\n\n[🎥] : *${this.model.config.prefix}video <youtube-url>*\n[🎧] : *${this.model.config.prefix}audio <youtube-url>*\n\n*Example :*\n${this.model.config.prefix}audio https://youtu.be/abcdefghij`);
          } else {
            async function detailYouTube(url) {
              this.replyMessage('[⏳] Loading..');
              try {
                let info = await ytdl.getInfo(url);
                let data = {
                  "channel": {
                    "name": info.videoDetails.author.name,
                    "user": info.videoDetails.author.user,
                    "channelUrl": info.videoDetails.author.channel_url,
                    "userUrl": info.videoDetails.author.user_url,
                    "verified": info.videoDetails.author.verified,
                    "subscriber": info.videoDetails.author.subscriber_count
                  },
                  "video": {
                    "title": info.videoDetails.title,
                    "description": info.videoDetails.description,
                    "lengthSeconds": info.videoDetails.lengthSeconds,
                    "videoUrl": info.videoDetails.video_url,
                    "publishDate": info.videoDetails.publishDate,
                    "viewCount": info.videoDetails.viewCount
                  }
                }
                this.replyMessage(`*CHANNEL DETAILS*\n• Name : *${data.channel.name}*\n• User : *${data.channel.user}*\n• Verified : *${data.channel.verified}*\n• Channel : *${data.channel.channelUrl}*\n• Subscriber : *${data.channel.subscriber}*`);
                this.replyMessage(`*VIDEO DETAILS*\n• Title : *${data.video.title}*\n• Seconds : *${data.video.lengthSeconds}*\n• VideoURL : *${data.video.videoUrl}*\n• Publish : *${data.video.publishDate}*\n• Viewers : *${data.video.viewCount}*`)
                this.replyMessage('*[✅]* Successfully!');
              } catch (err) {
                console.log(err);
                this.replyMessage('*[❎]* Failed!');
              }
            }

            async function downloadYouTube(replyMessage, url, format, filter) {
              replyMessage('[⏳] Loading, please wait..');
              let timeStart = Date.now();
              try {
                let info = await ytdl.getInfo(url);
                let data = {
                  "channel": {
                    "name": info.videoDetails.author.name,
                    "user": info.videoDetails.author.user,
                    "channelUrl": info.videoDetails.author.channel_url,
                    "userUrl": info.videoDetails.author.user_url,
                    "verified": info.videoDetails.author.verified,
                    "subscriber": info.videoDetails.author.subscriber_count
                  },
                  "video": {
                    "title": info.videoDetails.title,
                    "description": info.videoDetails.description,
                    "lengthSeconds": info.videoDetails.lengthSeconds,
                    "videoUrl": info.videoDetails.video_url,
                    "publishDate": info.videoDetails.publishDate,
                    "viewCount": info.videoDetails.viewCount
                  }
                }
                ytdl(url, { filter: filter, format: format, quality: 'highest' }).pipe(fs.createWriteStream(`./src/database/download.${format}`)).on('finish', async () => {
                  const media = await MessageMedia.fromFilePath(`./src/database/download.${format}`);
                  let timestamp = Date.now() - timeStart;
                  media.filename = `${info.videoDetails.title}.${format}`;
                  await replyMessage(media);
                  replyMessage('*[✅]* Successfully!');
                });
              } catch (err) {
                console.log(err);
                replyMessage('*[❎]* Failed!');
              }
            }

            if ((isGroups && config.groups) || isGroups) return;
            if (this.message.body == `${this.model.config.prefix}help`) return this.replyMessage(`*${this.model.config.name}*\n\n[🎥] : *${this.model.config.prefix}video <youtube-url>*\n[🎧] : *${this.model.config.prefix}audio <youtube-url>*\n\n*Example :*\n${this.model.config.prefix}audio https://youtu.be/abcdefghij`);
            if (url == undefined) return this.replyMessage('*[❎]* Failed!, Please insert YouTube URL');
            if (!ytdl.validateURL(url)) return this.replyMessage('*[❎]* Failed!, Invalid YouTube URL');
            if (this.message.body.startsWith(`${this.model.config.prefix}audio`)) {
              downloadYouTube(this.replyMessage, url, 'mp3', 'audioonly');
            } else if (this.message.body.startsWith(`${this.model.config.prefix}video`)) {
              downloadYouTube(this.replyMessage, url, 'mp4', 'audioandvideo');
            } else if (this.message.body.startsWith(`${this.model.config.prefix}detail`)) {
              detailYouTube(url);
            }
          }

        }
        else {
          const completion = await openai.chat.completions.create({

            messages: [
              { role: "system", content: text },
              { role: "user", content: "Hello, Eisax" }

            ],
            max_tokens: 50,
            model: "gpt-3.5-turbo",
          });
          this.replyMessage(completion.choices[0].message.content);
        }





        setTimeout(this.markAsRead, this.runAfter(2000, 5000));
      } catch (error) {
        console.error('Error handling incoming message:', error.message);
      }
    }
  }

  runAfter(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

module.exports = MessageController;
