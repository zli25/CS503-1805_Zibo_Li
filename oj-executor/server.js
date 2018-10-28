import express from 'express';
import bodyParser from 'body-parser';
import { buildAndRun } from './executorUtil';

const app = express();
const port = process.argv[2] || 5000;

app.post('/build_and_run', bodyParser.json(), (req, res) => {
	console.log(req.body);
	return buildAndRun(req.body['code'], req.body['lang']).then(
		result => res.json(result),
		error => res.status(400).json(error)
	);
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
