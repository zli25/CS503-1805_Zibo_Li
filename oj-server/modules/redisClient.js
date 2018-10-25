import redis from 'redis';

// only one client is created
const client = redis.createClient();

// we only call our own wapper set and get to store and get values from redis
const set = (key, value, cb) => {
	// error is the first parameter, so that we don't forget to handle the error
	client.set(key, value, (err, res) => {
		if (err) {
			console.log(err);
			return;
		}
		cb(res);
	});
};

const get = (key, cb) => {
	// error is the first argument, so that we don't forget to handle the error
	client.get(key, (err, res) => {
		if (err) {
			console.log(err);
			return;
		}
		cb(res);
	});
};

// redisClient.js
// only store the keys in timeInSeconds seconds
// once expired, keys will be deleted.
// since the cache is limited and may not be synchonoused with
// database, data only valid during a period of time
const expire = (key, timeInSeconds) => {
	client.expire(key, timeInSeconds);
};

const quit = () => {
	client.quit();
};

export const redisClient = {
	get,
	set,
	expire,
	quit,
	redisPrint: redis.print // directly export the function in redis
};
