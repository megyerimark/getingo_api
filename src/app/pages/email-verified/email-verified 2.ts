import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-email-verified',
  imports: [RouterLink],
  templateUrl: './email-verified.html',
  styleUrl: './email-verified.scss'
})
export class EmailVerified implements OnInit {
  user: User | null = null;
  sessionChecked = false;

  constructor(private auth: Auth) {}

  ngOnInit(): void {
    this.auth.restoreSession().subscribe(user => {
      this.user = user;
      this.sessionChecked = true;
    });
  }
}
