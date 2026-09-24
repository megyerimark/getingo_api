<?php

namespace App\Http\Controllers\Admin;;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class AdminController extends Controller
{
    public function dashboard()
    {
        // Alapvető statisztikák lekérése az Admin Dashboardra
        $totalUsers = User::count();
        $studentCount = User::where('role', 'user')->count();
        $adminCount = User::where('role', 'admin')->count();

        return response()->json([
            'message' => 'Üdv a Getingo Admin Paneljén!',
            'statistics' => [
                'total_users' => $totalUsers,
                'students' => $studentCount,
                'admins' => $adminCount
            ]
        ], 200);
}
}