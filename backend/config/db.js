const mongoose = require("mongoose");
const GridFSBucket = mongoose.mongo.GridFSBucket;

let conn; // Define a module-level variable to hold the connection
let bucket; // Define a module-level variable to hold the GridFS bucket

const connectDB = async () => {
  if (conn && bucket) {
    return { conn, bucket }; // Return the existing connection and bucket if they exist
  }

  try {
    conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "pdf",
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Set up the GridFS bucket
    bucket = new GridFSBucket(conn.connection.db, {
      bucketName: "pdfsBucket",
    });

    return { conn, bucket };
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
