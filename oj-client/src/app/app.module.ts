import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { routing } from './app.routes';
import { FormsModule } from '@angular/forms';
import { ProblemListComponent } from './components/problem-list/problem-list.component';
import { ProblemDetailComponent } from './components/problem-detail/problem-detail.component';
import { NewProblemComponent } from './components/new-problem/new-problem.component';
import { NavbarComponent } from './components/navbar/navbar.component';

@NgModule({
	declarations: [AppComponent, ProblemListComponent, ProblemDetailComponent, NewProblemComponent, NavbarComponent],
	imports: [BrowserModule, routing, FormsModule],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule {}
