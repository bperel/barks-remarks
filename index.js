const {Deepgram} = require('@deepgram/sdk');
const fs = require('fs');

const deepgramApiKey = fs.readFileSync('deepgram-key.txt').toString()
const deepgram = new Deepgram(deepgramApiKey);

const fileRoot = './subtitles/'
const fileNames = fs.readdirSync(fileRoot).filter(file => /.mp3$/.test(file))

const saveTranscription = async (file) => {
  const pathToFile = fileRoot + file;
  const mimetype = 'audio/mp3';

  console.log(file)
  const transcription = await deepgram.transcription.preRecorded(
    {buffer: fs.readFileSync(pathToFile), mimetype},
    {
      punctuate: true,
      language: 'en-US',
      utterances: true,
      diarize: true,
      keywords: ['Barks remarks', 'Carl Barks', 'Barks', 'Donald Duck', 'Donald', 'Duck', 'Scrooge', 'Scrooge Mc Duck', 'Huey, Dewey and Louie', 'Walt Disney', 'Disney', 'Don Rosa', 'William Van Horn', 'Al Taliaferro', 'Floyd Gottfredson', 'Ducktales', 'comics', 'comic books', 'Gladstone']
    },
  )
    .catch((err) => {
      console.log(err);
    });
  fs.writeFileSync(pathToFile.replace('.mp3', '.en.srt'), transcription.toSRT())
}

async function saveTranscriptionFromFileIndex(file) {
  if (fs.existsSync(fileRoot + file.replace(/.mp3$/, '.en.srt'))) {
    console.log(file + ' ignored because a subtitle file already exists')
  } else {
    await saveTranscription(file)
  }
}

(async () => {
  try {
    for (const fileName of fileNames) {
      await saveTranscriptionFromFileIndex(fileName)
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})();