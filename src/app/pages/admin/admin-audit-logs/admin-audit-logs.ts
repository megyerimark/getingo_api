import { Component, OnInit } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { AuditLog } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';

@Component({
  selector: 'app-admin-audit-logs',
  imports: [DatePipe, JsonPipe],
  templateUrl: './admin-audit-logs.html',
  styleUrl: './admin-audit-logs.scss'
})
export class AdminAuditLogs implements OnInit {
  logs: AuditLog[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getAuditLogs().subscribe(logs => this.logs = logs);
  }
}