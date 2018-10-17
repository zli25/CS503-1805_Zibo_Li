import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

import { Problem } from '../models/problem.model';

@Injectable({
	providedIn: 'root'
})
export class DataService {
	// private field start with _
	// BehavivorSubject: when subscribe, we can get the value that
	//emitted last time.
	// Subject: when subscribe, we can only get the value that emitted
	//after subscribe and we cannot get value that emitted before we
	//subscribe
	private _problemSource = new BehaviorSubject<Problem[]>([]);

	constructor(private httpClient: HttpClient) {}

	getProblems(): Observable<Problem[]> {
		this.httpClient
			.get('api/v1/problems')
			.toPromise()
			.then((res: any) => {
				// .next: next data
				this._problemSource.next(res);
			})
			.catch(this.handleError);
		return this._problemSource.asObservable();
	}

	getProblem(id: number): Promise<Problem> {
		return this.httpClient
			.get(`api/v1/problems/${id}`)
			.toPromise()
			.then((res: any) => res) // same as { return res }
			.catch(this.handleError);
	}

	addProblem(problem: Problem) {
		// "Content-Type" is case sensitive
		const options = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json'
			})
		};
		return this.httpClient
			.post('api/v1/problems', problem, options)
			.toPromise()
			.then((res: any) => res)
			.catch(this.handleError);
	}

	private handleError(error: any): Promise<any> {
		return Promise.reject(error.body || error);
	}
}
