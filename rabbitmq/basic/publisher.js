const amqp = require("amqplib");

async function connect() {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
    const channel = await connection.createChannel()
  } catch (e) {
    console.log(e);
  }
} 

connect();
