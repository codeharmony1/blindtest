import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .app {
        min-height: 100vh;
      }
    `,
  ],
})
export class AppComponent {
  title = 'blindtest';
}
