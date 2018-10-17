import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Problem } from '../../models/problem.model';
import { DataService } from '../../services/data.service';

@Component({
	selector: 'app-problem-list',
	templateUrl: './problem-list.component.html',
	styleUrls: ['./problem-list.component.css']
})
export class ProblemListComponent implements OnInit {
	// private problems list inside the component
	problems: Problem[];
	subscriptionProblems: Subscription;
	constructor(private dataService: DataService) {}

	ngOnInit() {
		//initialize problems in this class
		this.getProblems();
	}

	ngOnDestroy() {
		this.subscriptionProblems.unsubscribe();
	}

	getProblems() {
		this.subscriptionProblems = this.dataService.getProblems().subscribe(problems => (this.problems = problems));
	}
}
