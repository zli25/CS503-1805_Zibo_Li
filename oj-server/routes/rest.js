import express from 'express';
import bodyParser from 'body-parser';
import { problemService } from '../services/problemService';
import { Client as nodeRestClient } from 'node-rest-client';

const restClient = new nodeRestClient();
const jsonParser = bodyParser.json();

// executor
// const EXECUTOR_SERVER_URL = 'http://executor/build_and_run';
const EXECUTOR_SERVER_URL = 'http://localhost:5000/build_and_run';

restClient.registerMethod('build_and_run', EXECUTOR_SERVER_URL, 'POST');

const router = express.Router(); // import router

router.get('/problems', (req, res) => {
	return problemService.getProblems().then(problems => res.json(problems));
});

router.get('/problems/:id', (req, res) => {
	return problemService.getProblem(+req.params.id).then(problem => res.json(problem));
});

router.post('/problems', jsonParser, (req, res) => {
	return problemService
		.addProblem(req.body)
		.then(problem => res.json(problem), error => res.status(400).send('Problem name already exists!'));
});

router.post('/problems/:id', jsonParser, (req, res) => {
	return problemService
		.editProblem(req.body)
		.then(problem => res.json(problem), error => res.status(400).send(error.message));
});

// this build_and_run was requeted from oj-client, req = request from oj-client
// res = response to oj-client
router.post('/build_and_run', jsonParser, (req, res) => {
	const code = req.body.code;
	const lang = req.body.lang;

	console.log('lang: ', lang, 'code: ', code);

	// this build_and_run is an API on executor
	restClient.methods.build_and_run(
		{
			data: { code: code, lang: lang },
			headers: { 'Content-Type': 'application/json' }
		},
		// data and response are from the executor
		(data, response) => {
			const text = `Build output: ${data['build']}, execute output: ${data['run']}`;
			// we packaged the result from executor, and send back to oj-client
			res.json(text);
		}
	);
});

export default router;
