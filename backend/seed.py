import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medflare_backend.settings')
django.setup()

from api.models import User, Hospital, Pharmacy, Patient, HospitalStaff, Doctor

def seed():
    print("Creating Patient (9876543210)...")
    if not User.objects.filter(phone_number='9876543210').exists():
        user = User.objects.create_user(phone_number='9876543210', name='Demo Patient', role='patient')
        Patient.objects.create(user=user)

    print("Creating Hospital Admin (9876543211)...")
    hospital = None
    if not User.objects.filter(phone_number='9876543211').exists():
        hosp_user = User.objects.create_user(phone_number='9876543211', name='City General Hospital', role='hospital')
        hospital = Hospital.objects.create(
            admin=hosp_user,
            hospital_name='City General Hospital',
            registration_number='REG-12345',
            address='123 Health Ave',
            city='Bangalore',
            state='Karnataka',
            pincode='560001',
            is_verified=True
        )
    else:
        hospital = Hospital.objects.get(admin__phone_number='9876543211')

    print("Creating Pharmacy (9876543212)...")
    if not User.objects.filter(phone_number='9876543212').exists():
        pharm_user = User.objects.create_user(phone_number='9876543212', name='Apollo Pharmacy', role='pharmacy')
        Pharmacy.objects.create(
            admin=pharm_user,
            pharmacy_name='Apollo Pharmacy',
            license_number='LIC-12345',
            address='456 Wellness Blvd',
            city='Bangalore',
            state='Karnataka',
            pincode='560002',
            is_verified=True
        )

    print("Creating Platform Admin (9876543213)...")
    if not User.objects.filter(phone_number='9876543213').exists():
        User.objects.create_superuser(phone_number='9876543213', name='System Admin')

    # Add staff to hospital
    print("Creating Hospital Staff...")
    staff_roles = [
        ('9876543221', 'Dr. Director Smith', 'director'),
        ('9876543222', 'Mr. Super Intendent', 'superintendent'),
        ('9876543223', 'Dr. Jane Doe', 'doctor'),
    ]

    for phone, name, role in staff_roles:
        if not User.objects.filter(phone_number=phone).exists():
            staff_user = User.objects.create_user(phone_number=phone, name=name, role='hospital')
            staff_user.set_unusable_password()
            staff_user.save()
            HospitalStaff.objects.create(hospital=hospital, user=staff_user, role=role)
            if role == 'doctor':
                Doctor.objects.create(hospital=hospital, user=staff_user, name=name, specialization='General Physician')

    print("Seed complete!")

if __name__ == '__main__':
    seed()
