const {getRadarImages} = require('./jobs/radarJob')
const { S3Client} = require("@aws-sdk/client-s3");
require('dotenv').config()
const cron = require('node-cron');

const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

//conexão com o s3
const s3 = new S3Client({
    region: 'dummy-dummy',
    endpoint: process.env.S3_ENDPOINT,
    credentials:{
        accessKeyId,
        secretAccessKey,
    },
    forcePathStyle: true,
});

cron.schedule ( '* * * * *' ,  ( )  =>  { 
  getRadarImages(s3, 'pnova')
} ) ;

