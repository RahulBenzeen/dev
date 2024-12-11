
// const kafka = require("kafka-node");


// const Producer = kafka.Producer;

// const client = new kafka.KafkaClient({kafkaHost:process.env.KAFKA_HOST});

// const producer = new Producer(client);


// const sendEmailRequest = (emailData) =>{
//      const message = JSON.stringify(emailData);
//      const payload = [
//         { topic: process.env.KAFKA_TOPIC, message: message, partition: 0}
//      ]

//      producer.send(payload, (err, data) => {
//         if(err){

//             console.log("Error sending email request: ", err)
//         }else{
//             console.log("Email request sent: ", data)
//         }
//      })
// }


// module.exports = sendEmailRequest
