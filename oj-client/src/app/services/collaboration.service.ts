import { Injectable } from '@angular/core';
declare var io: any; // io is alread imported in .angular.cli.json

@Injectable({
	providedIn: 'root'
})
export class CollaborationService {
	collaborationSocket: any;
	participants: String[];

	constructor() {}

	init(editor: any, participants: any, sessionId: string): void {
		// window.location.origin: the server location on the current page
		// for example, the current page on the browser is
		// "localhost:3000/problems/1", the window.location.origin = "http/localhost:3000"
		this.collaborationSocket = io(window.location.origin, {
			query: 'sessionId=' + sessionId
		});

		// handler the changes send from server.
		this.collaborationSocket.on('change', (delta: string) => {
			console.log('collabration: editor changes ' + delta);
			delta = JSON.parse(delta); // delta is json format;
			editor.lastAppliedChange = delta;
			// apply the changes on editor
			editor
				.getSession()
				.getDocument()
				.applyDeltas([delta]);
		});

		// handler the changes send from server.
		this.collaborationSocket.on('participants', (onlineParticipants: string) => {
			console.log('participants ' + onlineParticipants);
			participants.onlineParticipants = onlineParticipants;
		});

		// handler the changes send from server.
		this.collaborationSocket.on('participantJoin', (participantJoinned: string) => {
			console.log('participant joinned ' + participantJoinned);
			participants.onlineParticipants.push(participantJoinned);
		});

		// handler the changes send from server.
		this.collaborationSocket.on('participantDrop', (participantDropped: string) => {
			console.log('participant dropped ' + participantDropped);
			participants.onlineParticipants = participants.onlineParticipants.filter(
				participant => participant !== participantDropped
			);
		});
	}

	restoreBuffer(): void {
		this.collaborationSocket.emit('restoreBuffer');
	}

	// emit event to make changes and inform server and other collaborators
	change(delta: string): void {
		// emit "change" event
		this.collaborationSocket.emit('change', delta);
	}
}
