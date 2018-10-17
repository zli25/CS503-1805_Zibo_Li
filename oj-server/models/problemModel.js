import mongoose from 'mongoose';

const ProblemSchema = mongoose.Schema({
	id: Number,
	name: String,
	desc: String,
	difficulty: String
});

export const ProblemModel = mongoose.model('ProblemModel', ProblemSchema);
