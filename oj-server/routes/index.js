import express from 'express';
import path from 'path';

const router = express.Router();

// If the url does not handled by router on the server side, then the
// server send index.html from the public folder
router.get('/', (req, res) => {
	res.sendFile('index.html', {
		root: path.join(__dirname, '../../public/')
	});
});

export default router;
