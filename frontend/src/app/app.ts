import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogComponent } from './shared/components/dialog/dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('olive-management');
}
