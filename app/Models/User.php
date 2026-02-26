<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nama_lengkap',
        'nip',
        'username',
        'email',
        'password',
        'role',
        'pimpinan_type',
        'tim_kerja_id',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    //Relationships
    public function timkerja()
    {
        return $this->belongsTo(TimKerja::class, 'tim_kerja_id');
    }

    // Helper Methods
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isKetuaTimKerja(): bool 
    {
        return $this->role === 'ketua_tim_kerja';
    }

    public function isPimpinan(): bool
    {
        return $this->role === 'pimpinan';
    }

    public function isBendahara(): bool 
    {
        return $this->role === 'bendahara';
    }

    public function isPimpinanKabagUmum(): bool
    {
        return $this->isPimpinan() && $this->pimpinan_type === 'kabag_umum';
    }

    public function isPimpinanPPK(): bool
    {
        return $this->isPimpinan() && $this->pimpinan_type === 'ppk';
    }

    public function getRoleNameAttribute(): string 
    {
        return match($this->role){
            'super_admin' => 'Super Admin',
            'ketua_tim_kerja' => 'Ketua Tim Kerja',
            'pimpinan' => $this->pimpinan_type === 'kabag_umum' ? 'Kabag Umum' : 'PPK',
            'bendahara' => 'Bendahara',
            default => 'Unknown',
        };
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
