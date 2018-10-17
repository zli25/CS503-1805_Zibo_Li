import express from 'express';
import bodyParser from 'body-parser';
import { problemService } from '../services/problemService';

const router = express.Router(); // import router

router.get('/problems', (req, res) => {
	return problemService.getProblems().then(problems => res.json(problems));
});

router.get('/problems/:id', (req, res) => {
	return problemService.getProblem(+req.params.id).then(problem => res.json(problem));
});

router.post('/problems', bodyParser.json(), (req, res) => {
	return problemService
		.addProblem(req.body)
		.then(problem => res.json(problem), error => res.status(400).send('Problem name already exists!'));
});

router.post('/problems/:id', bodyParser.json(), (req, res) => {
	return problemService
		.editProblem(req.body)
		.then(problem => res.json(problem), error => res.status(400).send(error.message));
});

export default router;
