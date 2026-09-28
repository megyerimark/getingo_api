<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'action' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = AdminAuditLog::query()
            ->with('actor:id,name,email')
            ->latest();

        if (!empty($validated['action'])) {
            $query->where('action', $validated['action']);
        }

        return response()->json(
            $query->paginate($validated['per_page'] ?? 50)
        );
    }
}
