import { merge } from 'lodash';
import { ProblemModel } from '../models/problemModel';

const problems = [];

const getProblems = () => {
	return new Promise((resolve, reject) => {
		ProblemModel.find({}, (err, problems) => {
			if (err) {
				reject(err);
			} else {
				resolve(problems);
			}
		});
	});
};

// get problem by ID
const getProblem = id => {
	return new Promise((resolve, reject) => {
		// {id: id}: find problem whose id matches input id
		// findOne: find one item
		ProblemModel.findOne({ id: id }, (err, problem) => {
			if (err) {
				reject(err);
			} else {
				resolve(problem);
			}
		});
	});
};
// add problem
const addProblem = newProblem => {
	return new Promise((resolve, reject) => {
		// check if the problem is already in the db
		ProblemModel.findOne({ name: newProblem.name }, function(err, data) {
			if (data) {
				// if we find data, the problem exists
				reject('Problem already exists');
			} else {
				// save the problem to mongodb
				// count: get the number of problems already in db
				ProblemModel.count({}, (err, count) => {
					newProblem.id = count + 1;
					// create mongodb object
					const mongoProblem = new ProblemModel(newProblem);
					mongoProblem
						.save()
						.then(problem => resolve(problem))
						.catch(error => reject(error.body || error));
				});
			}
		});
	});
};

// edit problem
const editProblem = problemToUpdate => {
	return new Promise((resolve, reject) => {
		// check if the problem is already in the db
		ProblemModel.findOne({ name: problemToUpdate.name }, function(err, data) {
			if (data) {
				data = merge(data, problemToUpdate);
				data
					.save()
					.then(updatedProblem => resolve(updatedProblem))
					.catch(error => reject(error.body || error));
			} else {
				reject('Problem not found');
			}
		});
	});
};

export const problemService = {
	getProblems,
	getProblem,
	addProblem,
	editProblem
};
