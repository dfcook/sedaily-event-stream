import redis from 'redis';


import { Consumer } from './Consumer';

redis.add_command('xrange');
redis.add_command('xread');


const parseXreadResponse = response => ({
  topic: response[0][0],
  eventId: response[0][1][0][0],
  eventData: response[0][1][0][1][1]
});


class RedisConsumer extends Consumer {
  constructor() {
    super();
    this.client = new redis.RedisClient();
  }

  subscribe(args, callback, errorCallback) {
    const xreadParams = ['BLOCK', 0, 'STREAMS', ...args.topics, ...args.topicOffsets];

    const onMessage = (error, response) => {
      if (error) {
        errorCallback(error);
      } else {
        callback(parseXreadResponse(response));
      }
      this.client.xread(xreadParams, onMessage);
    };

    this.client.xread(xreadParams, onMessage);
  }

  getSlice(args, callback, errorCallback) {
    const startId = (args.startId) ? args.startId : '-';
    const stopId = (args.stopId) ? args.stopId : '+';

    this.client.xrange([args.topic, startId, stopId], (error, response) => {
      if (error) {
        errorCallback(error);
      } else {
        callback(response);
      }
    });
  }
}


export default { RedisConsumer };
