"""
Django Admin registration for MediChain models.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Hospital, Pharmacy, Doctor, Patient, Appointment


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('name', 'phone_number', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('name', 'phone_number', 'aadhar_number', 'email')
    ordering = ('-created_at',)

    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        ('Personal Info', {'fields': ('name', 'aadhar_number', 'email', 'role', 'avatar')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('hospital_name', 'city', 'state', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'state')
    search_fields = ('hospital_name', 'registration_number', 'city')


@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ('pharmacy_name', 'city', 'state', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'state')
    search_fields = ('pharmacy_name', 'license_number', 'city')


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('name', 'specialization', 'hospital', 'is_available', 'experience_years')
    list_filter = ('is_available', 'specialization')
    search_fields = ('name', 'specialization')


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'gender', 'blood_group', 'city', 'created_at')
    list_filter = ('gender', 'blood_group')
    search_fields = ('user__name', 'user__phone_number')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'hospital', 'appointment_date', 'status')
    list_filter = ('status', 'appointment_date')
    search_fields = ('patient__user__name', 'doctor__name')
