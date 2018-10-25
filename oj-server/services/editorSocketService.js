import { redisClient } from '../modules/redisClient';

const SESSION_PATH = '/temp_sessions/';
const TIMEOUT_IN_SECONDS = 3600;

export const editorSocketService = io => {
	// collaboration sessions
	// record all the participants in each session
	// so that server can send changes to all participants in a session
	var collaborations = {};
	// map from socketId to sessionId
	var socketIdToSessionId = {};
	io.on('connection', socket => {
		// get sessionId
		let sessionId = socket.handshake.query['sessionId'];

		socketIdToSessionId[socket.id] = sessionId;
		// if sessionId is not in collaborations, it means no one does this problem before
		// add current socket id to collaboration session participants
		if (!(sessionId in collaborations)) {
			collaborations[sessionId] = {
				participants: [],
				cachedInstructions: []
			};
			redisClient.get(SESSION_PATH + sessionId, data => {
				if (data) {
					console.log('session terminated previously, pulling back from redis');
					collaborations[sessionId]['cachedInstructions'] = JSON.parse(data);
				}
			});
		}

		// Add the newly joined user to the participants
		collaborations[sessionId]['participants'].push(socket.id);

		// Send all the online participants to the newly joined user
		io.to(socket.id).emit('participants', collaborations[sessionId]['participants']);
		collaborations[sessionId]['participants'].forEach(participant => {
			if (participant !== socket.id) {
				io.to(participant).emit('participantJoin', socket.id);
			}
		});

		// socket event listeners
		// delta is the change info
		// it records the row and cloumn of the changes
		socket.on('change', delta => {
			// get session id based on socket.id
			let sessionId = socketIdToSessionId[socket.id];
			collaborations[sessionId]['cachedInstructions'].push(['change', delta, Date.now()]);

			if (sessionId in collaborations) {
				// get all participants in this session
				let participants = collaborations[sessionId]['participants'];
				// send changes to all participants
				participants.forEach(participant => {
					if (socket.id != participant) {
						io.to(participant).emit('change', delta);
					}
				});
			} else {
				console.log('warning: could not find socket id in collaborations');
			}
		});

		socket.on('restoreBuffer', () => {
			collaborations[sessionId]['cachedInstructions'].forEach(instruction => {
				socket.emit(instruction[0], instruction[1]);
			});
		});

		// When a user disconnected, remove it from the participants and broadcast to all online users
		socket.on('disconnect', reason => {
			collaborations[sessionId]['participants'] = collaborations[sessionId]['participants'].filter(
				participant => participant !== socket.id
			);
			if (collaborations[sessionId]['participants'].length == 0) {
				console.log('last participant is leaving, commit to redis');
				const key = SESSION_PATH + sessionId;
				redisClient.set(key, JSON.stringify(collaborations[sessionId]['cachedInstructions']), redisClient.redisPrint);
				// set expire time
				redisClient.expire(key, TIMEOUT_IN_SECONDS);
				delete collaborations[sessionId];
			} else {
				collaborations[sessionId]['participants'].forEach(participant => {
					io.to(participant).emit('participantDrop', socket.id);
				});
			}
		});
	});
};
