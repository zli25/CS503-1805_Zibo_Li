import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import path from 'path';
import socketIO from 'socket.io';
import { default as restRouter } from './routes/rest';
import { default as indexRouter } from './routes';
import { editorSocketService } from './services/editorSocketService';

const app = express();
const port = 3000;

mongoose.connect(
	'mongodb://admin:ziboadmin1234@ds129344.mlab.com:29344/oj',
	{ useNewUrlParser: true }
);

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/v1', restRouter);
app.use('/*', indexRouter);

// connect io with server
const server = http.createServer(app);
const io = socketIO();
editorSocketService(io);
io.attach(server);

server.listen(port);
server.on('listening', () => {
	console.log('App is listening to port 3000!');
});
