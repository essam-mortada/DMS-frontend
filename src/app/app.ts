import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet],
  styleUrl: './app.css',
  template: `<router-outlet></router-outlet>`
})
export class App {
  protected title = 'dms-frontend';
}
