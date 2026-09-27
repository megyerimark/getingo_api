# Getingo API

Backend service powering the Getingo learning platform.

## 🚀 About

Getingo is a modern educational platform designed to help developers learn programming through interactive courses, exercises, notes and real-world projects.

## ✨ Features

- Authentication & Authorization
- Course Management
- Lesson Management
- User Progress Tracking
- Notes System
- Exercise Platform
- Role-Based Access Control (RBAC)
- Payments & Subscriptions
- Admin Dashboard API

## 🛠️ Tech Stack

- Laravel
- PHP 8+
- MySQL
- REST API
- JWT Authentication
- Docker

## 📦 Installation

```bash
git clone https://github.com/megyerimark/getingo_api.git
cd getingo_api

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan serve
