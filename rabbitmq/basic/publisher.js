const amqp = require("amqplib");

async function connect() {
  try {
    const connection = await amqp.connect("amqp://localhost:5672");
  } catch (e) {
    console.log(e);
  }
}

connect();
