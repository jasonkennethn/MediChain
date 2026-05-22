"""
MediChain Data Models

Separate tables for: User, Hospital, Pharmacy, Doctor, Patient
as specified in the project requirements.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid


class UserManager(BaseUserManager):
    """Custom user manager that uses phone_number for authentication."""

    def create_user(self, phone_number, name, role='patient', password=None, **extra_fields):
        if not phone_number:
            raise ValueError('Phone number is required')
        if not name:
            raise ValueError('Name is required')

        user = self.model(
            phone_number=phone_number,
            name=name,
            role=role,
            **extra_fields,
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone_number, name, role='admin', password=password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model. Uses phone_number as the unique identifier.
    Role-based: admin, patient, hospital, pharmacy.
    """

    ROLE_CHOICES = [
        ('admin', 'Application Admin'),
        ('patient', 'Patient'),
        ('hospital', 'Hospital'),
        ('pharmacy', 'Pharmacy'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=10, unique=True)
    aadhar_number = models.CharField(max_length=12, unique=True, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    avatar = models.URLField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'user'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.role}) - {self.phone_number}'


class Hospital(models.Model):
    """Hospital entity — each hospital has an admin user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.OneToOneField(User, on_delete=models.CASCADE, related_name='hospital_profile')
    hospital_name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)
    phone = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    specializations = models.JSONField(default=list, blank=True)
    facilities = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hospital'
        ordering = ['hospital_name']

    def __str__(self):
        return self.hospital_name


class Pharmacy(models.Model):
    """Pharmacy / Medical Shop entity — each has an admin user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.OneToOneField(User, on_delete=models.CASCADE, related_name='pharmacy_profile')
    pharmacy_name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=100, unique=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=6)
    phone = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pharmacy'
        verbose_name_plural = 'pharmacies'
        ordering = ['pharmacy_name']

    def __str__(self):
        return self.pharmacy_name


class Doctor(models.Model):
    """Doctor — associated with a hospital."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='doctors')
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    specialization = models.CharField(max_length=200)
    qualification = models.CharField(max_length=255, null=True, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor'
        ordering = ['name']

    def __str__(self):
        return f'Dr. {self.name} — {self.specialization}'


class Patient(models.Model):
    """Patient profile — linked to a user account."""

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    pincode = models.CharField(max_length=6, null=True, blank=True)
    emergency_contact = models.CharField(max_length=15, null=True, blank=True)
    medical_history = models.TextField(null=True, blank=True)
    allergies = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'patient'
        ordering = ['-created_at']

    def __str__(self):
        return f'Patient: {self.user.name}'


class Appointment(models.Model):
    """Appointment between a patient and a doctor at a hospital."""

    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateTimeField()
    reason = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(null=True, blank=True)
    symptoms = models.TextField(null=True, blank=True)
    diagnosis = models.TextField(null=True, blank=True)
    prescription_data = models.JSONField(default=list, blank=True)
    follow_up_instructions = models.TextField(null=True, blank=True)
    tests_advised = models.TextField(null=True, blank=True)
    transcript = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointment'
        ordering = ['-appointment_date']

    def __str__(self):
        return f'{self.patient.user.name} → Dr. {self.doctor.name} on {self.appointment_date}'
