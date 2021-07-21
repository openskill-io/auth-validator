const { Queue, Worker } = require('bullmq');

const validatorResponseQ = new Queue('validatorResponseQ');

new Worker('validatorRequestQ', async ({ data }) => {
  try {
    await validatorResponseQ.add('response', { ...data, success: (Math.random() < 0.5) });
  } catch (error) {
    throw error;
  }
});

console.log('validator service running');