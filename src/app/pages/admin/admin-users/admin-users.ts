import { Component, OnInit } from '@angular/core';
import { AdminUser } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-users',
  imports: [],
  templateUrl: './admin-users.html'
})
export class AdminUsers implements OnInit {
  users: AdminUser[] = [];
  loading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.getUsers().subscribe(users => {
      this.users = users;
      this.loading = false;
    });
  }

  changeRole(user: AdminUser, role: 'student' | 'admin'): void {
    this.adminService.updateUserRole(user.id, role).subscribe(() => {
      user.role = role;
    });
  }

  toggleBan(user: AdminUser): void {
    this.adminService.toggleBan(user.id).subscribe(response => {
      user.is_banned = response.is_banned;
    });
  }

  get students(): number {
    return this.users.filter(user => user.role === 'student').length;
  }

  get admins(): number {
    return this.users.filter(user => user.role === 'admin').length;
  }

  get banned(): number {
    return this.users.filter(user => user.is_banned).length;
  }
}