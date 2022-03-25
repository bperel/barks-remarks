const {Deepgram} = require('@deepgram/sdk');
const fs = require('fs');

const deepgramApiKey = fs.readFileSync('deepgram-key.txt')

const file = ' 00 - Intro-Duck-tion.mp3'

const fileRoot = '/home/bruno/Music/'
const pathToFile = fileRoot + file;
const mimetype = 'audio/mp3';

const deepgram = new Deepgram(deepgramApiKey);

deepgram.transcription.preRecorded(
    {buffer: fs.readFileSync(pathToFile), mimetype},
    {
        punctuate: true,
        language: 'en-US',
        utterances: true,
        diarize: true,
        keywords: ['Carl', 'Barks', 'Donald', 'Duck', 'Scrooge', 'Mc', 'Duck', 'Huey, Dewey and Louie', 'Walt', 'Disney', 'Don', 'Rosa', 'William', 'Van Horn', 'Al', 'Taliaferro', 'Floyd', 'Gottfredson', 'Ducktales', 'comics', 'comic books', 'Gladstone']
    },
)
    .then((transcription) => {
        fs.writeFileSync(pathToFile.replace('.mp3', '.srt'), transcription.toSRT())
    })
    .catch((err) => {
        console.log(err);
    });
