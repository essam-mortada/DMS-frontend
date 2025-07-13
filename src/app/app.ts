import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  template: `<router-outlet></router-outlet>`

})
export class App {
  protected title = 'dms-frontend';
}
