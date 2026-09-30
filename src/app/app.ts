import { DOCUMENT } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Navbar } from './shared/navbar/navbar';
import { Auth } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly document = inject(DOCUMENT);

  constructor(
    public router: Router,
    public auth: Auth
  ) {
    effect(() => {
      const premium = this.auth.currentUser()?.is_premium === true;
      this.document.body.classList.toggle('premium-theme', premium);
    });
  }
}
