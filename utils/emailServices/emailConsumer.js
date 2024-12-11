// const kafka = require("kafka-node")
// const sendEmail = require('./emailSender')



// const Consumer = kafka.Consumer
// const client =  new kafka.KafkaClient({kafkaHost:process.env.KAFKA_HOST})

// const consumer = new Consumer(
//     client,
//     [{topic: process.env.KAFKA_TOPIC,  partition:0}],
//     {autoCommit:true}
// );



// consumer.on("message", (message)=>{
//     const emailData = JSON.stringify(message.value)
//     sendEmail(emailData)
// });

// consumer.on("error", (err) => {
//     console.error("Error in Kaka Copnsumer ", err)
// })