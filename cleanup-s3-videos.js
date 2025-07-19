const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1'
});

const bucketName = process.env.AWS_S3_BUCKET_NAME;

async function deleteAllVideos() {
  try {
    console.log('Listing all objects in S3 bucket...');
    
    // List all objects with videos/ prefix
    const listParams = {
      Bucket: bucketName,
      Prefix: 'videos/'
    };
    
    const listedObjects = await s3.listObjectsV2(listParams).promise();
    
    if (listedObjects.Contents.length === 0) {
      console.log('No video files found in S3.');
      return;
    }
    
    console.log(`Found ${listedObjects.Contents.length} video files to delete.`);
    
    // Delete all objects
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key }))
      }
    };
    
    const deleteResult = await s3.deleteObjects(deleteParams).promise();
    console.log(`Successfully deleted ${deleteResult.Deleted.length} video files from S3.`);
    
    // List remaining objects to verify cleanup
    const remainingObjects = await s3.listObjectsV2(listParams).promise();
    console.log(`Remaining video files in S3: ${remainingObjects.Contents.length}`);
    
  } catch (error) {
    console.error('Error deleting S3 videos:', error);
  }
}

deleteAllVideos();