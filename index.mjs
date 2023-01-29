import deepgram from '@deepgram/sdk';
import fs from 'fs';
import request from 'follow-redirects';
import jsdom from "jsdom";
import {markdownTable} from 'markdown-table'

const deepgramApiKey = fs.readFileSync('deepgram-key.txt').toString()
const deepgramApi = new deepgram.Deepgram(deepgramApiKey);

const fileRoot = './subtitles/'

let currentEpisodeIndex = 0
let episodes

const fullyTranscribedEpisodes = [0]

const saveTranscription = async (pathToFile) => {
  const pathToSrt = pathToFile.replace(/.mp3$/, '.en.srt');
  if (fs.existsSync(pathToSrt)) {
    console.log(` ${pathToSrt} already exists`)
    return
  }
  console.log(` Creating transcription...`)

  const transcription = await deepgramApi.transcription.preRecorded(
    {buffer: fs.readFileSync(pathToFile), mimetype: 'audio/mp3'},
    {
      model: 'phonecall',
      punctuate: true,
      language: 'en-US',
      utterances: true,
      diarize: true,
      keywords: [
        'Barks remarks', 'Carl Barks', 'Barks', 'Donald Duck', 'Donald', 'Duck', 'Scrooge', 'Scrooge Mc Duck', 'Huey, Dewey and Louie',
        'Walt Disney', 'Disney', 'Don Rosa', 'William Van Horn', 'Al Taliaferro', 'Floyd Gottfredson', 'Ducktales', 'comics', 'comic books',
        'Gladstone', 'Mark Severino', 'Inducks'
      ]
    },
  )
    .catch((err) => {
      console.log(err);
    });
  fs.writeFileSync(pathToFile.replace('.mp3', '.en.srt'), transcription.toSRT())
  console.log(` Done.`)
}

const processNextEpisode = async () => {
  const {title, url} = episodes[currentEpisodeIndex];
  console.log('Processing ' + title + ' ...')
  const mp3FilePath = `${fileRoot}${title.replace('/', ' - ')}.mp3`;
  if (fs.existsSync(mp3FilePath)) {
    console.log(` ${mp3FilePath} already exists`)
    await saveTranscription(mp3FilePath)
    currentEpisodeIndex++
    await processNextEpisode()
  } else {
    const file = fs.createWriteStream(mp3FilePath);
    console.log(` Downloading...`)
    request.https.get(url, response => {
      response.pipe(file);
      file.on('finish', async () => {
        file.close();
        console.log(` Done.`)
        await saveTranscription(mp3FilePath)
        currentEpisodeIndex++
        await processNextEpisode()
      })
    })
  }
};

const retrieveEpisodes = () => {
  console.log('Retrieving the list of episodes...')
  const rssDocument = new jsdom.JSDOM(fs.readFileSync('barks-remarks.rss'), 'text/xml');

  const rssEpisodes = [...rssDocument.window.document.querySelectorAll("item")].reverse();
  episodes = rssEpisodes.map((episode, idx) => ({
    title: episode.querySelector('title').innerHTML.replace(/(\[<|&lt;)!\[CDATA\[/, '').replace(/]](>|&gt;)/, ''),
    url: episode.querySelector('enclosure').getAttribute('url'),
    publicationDate: episode.querySelector('pubDate').innerHTML,
    duration: episode.querySelector('itunes\\:duration').innerHTML,
    isFullyTranscribed: fullyTranscribedEpisodes.includes(idx) ? 'Yes' : 'No'
  }))

  const episodeLines = Object.values(episodes).map(({title, url, publicationDate, duration, isFullyTranscribed}) => ([
    `[${title}](${url})`,
    publicationDate,
    duration,
    isFullyTranscribed
  ]))

  fs.writeFileSync('README.md', fs.readFileSync('README.md').toString().replace(/<!-- Episodes -->.+/sm, '<!-- Episodes -->\n' + markdownTable([
    ['Title', 'Publication date', 'Duration', 'Transcription completed'],
    ...episodeLines]).replace(/- \|/g, '--|').replace(/\| -/g, '|--')))

  console.log('Done')
};

(async () => {
  try {
    const file = fs.createWriteStream("barks-remarks.rss");
    request.https.get("https://anchor.fm/s/5c6d17d8/podcast/rss", response => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        retrieveEpisodes();
        processNextEpisode();
      });
    });
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})();