"""
Management command to seed the database with demo data.
Creates the 4 demo users (Patient, Hospital, Pharmacy, Admin)
plus sample doctors and appointments.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import User, Hospital, Pharmacy, Doctor, Patient, Appointment


class Command(BaseCommand):
    help = 'Seed the database with demo data for MediChain'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding MediChain database...\n')

        # ── 1. Create Users ──
        patient_user, created = User.objects.get_or_create(
            phone_number='9876543210',
            defaults={
                'name': 'John Doe',
                'aadhar_number': '123456789012',
                'email': 'john@example.com',
                'role': 'patient',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created patient user: {patient_user.name}'))
        else:
            self.stdout.write(f'  ↳ Patient user already exists: {patient_user.name}')

        hospital_user, created = User.objects.get_or_create(
            phone_number='9876543211',
            defaults={
                'name': 'City Hospital',
                'aadhar_number': '123456789013',
                'email': 'hospital@example.com',
                'role': 'hospital',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created hospital user: {hospital_user.name}'))
        else:
            self.stdout.write(f'  ↳ Hospital user already exists: {hospital_user.name}')

        pharmacy_user, created = User.objects.get_or_create(
            phone_number='9876543212',
            defaults={
                'name': 'MedPlus Pharmacy',
                'aadhar_number': '123456789014',
                'email': 'pharmacy@example.com',
                'role': 'pharmacy',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created pharmacy user: {pharmacy_user.name}'))
        else:
            self.stdout.write(f'  ↳ Pharmacy user already exists: {pharmacy_user.name}')

        admin_user, created = User.objects.get_or_create(
            phone_number='9876543213',
            defaults={
                'name': 'Admin User',
                'aadhar_number': '123456789015',
                'email': 'admin@example.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created admin user: {admin_user.name}'))
        else:
            self.stdout.write(f'  ↳ Admin user already exists: {admin_user.name}')

        # ── 2. Create Patient Profile ──
        patient, created = Patient.objects.get_or_create(
            user=patient_user,
            defaults={
                'date_of_birth': '1995-06-15',
                'gender': 'male',
                'blood_group': 'O+',
                'address': '123 Main Street, Banjara Hills',
                'city': 'Hyderabad',
                'state': 'Telangana',
                'pincode': '500034',
                'emergency_contact': '9876543299',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✓ Created patient profile'))

        # ── 3. Create Hospital ──
        hospital, created = Hospital.objects.get_or_create(
            admin=hospital_user,
            defaults={
                'hospital_name': 'City Hospital',
                'registration_number': 'HOSP-HYD-001',
                'address': '456 Health Avenue, Jubilee Hills',
                'city': 'Hyderabad',
                'state': 'Telangana',
                'pincode': '500033',
                'phone': '04023456789',
                'email': 'info@cityhospital.com',
                'specializations': ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics'],
                'facilities': ['ICU', 'Emergency', 'Lab', 'Pharmacy', 'X-Ray'],
                'is_verified': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created hospital: {hospital.hospital_name}'))

        # Create a second hospital
        hospital_user2, _ = User.objects.get_or_create(
            phone_number='9876543220',
            defaults={
                'name': 'Heart Care Center',
                'aadhar_number': '123456789020',
                'email': 'heartcare@example.com',
                'role': 'hospital',
            }
        )
        hospital2, created = Hospital.objects.get_or_create(
            admin=hospital_user2,
            defaults={
                'hospital_name': 'Heart Care Center',
                'registration_number': 'HOSP-HYD-002',
                'address': '789 Cardiac Lane, Madhapur',
                'city': 'Hyderabad',
                'state': 'Telangana',
                'pincode': '500081',
                'phone': '04098765432',
                'email': 'info@heartcarecenter.com',
                'specializations': ['Cardiology', 'Cardiac Surgery', 'Vascular Surgery'],
                'facilities': ['Cath Lab', 'ICU', 'Emergency', 'Rehab'],
                'is_verified': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created hospital: {hospital2.hospital_name}'))

        # ── 4. Create Pharmacy ──
        pharmacy, created = Pharmacy.objects.get_or_create(
            admin=pharmacy_user,
            defaults={
                'pharmacy_name': 'MedPlus Pharmacy',
                'license_number': 'PH-TS-001',
                'address': '101 Medicine Road, Ameerpet',
                'city': 'Hyderabad',
                'state': 'Telangana',
                'pincode': '500016',
                'phone': '04012345678',
                'email': 'contact@medplus.com',
                'is_verified': True,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created pharmacy: {pharmacy.pharmacy_name}'))

        # ── 5. Create Doctors ──
        doctors_data = [
            {
                'hospital': hospital,
                'name': 'Priya Sharma',
                'phone_number': '9876500001',
                'email': 'priya.sharma@cityhospital.com',
                'specialization': 'General Physician',
                'qualification': 'MBBS, MD',
                'experience_years': 12,
                'consultation_fee': 500,
            },
            {
                'hospital': hospital2,
                'name': 'Rahul Patel',
                'phone_number': '9876500002',
                'email': 'rahul.patel@heartcare.com',
                'specialization': 'Cardiologist',
                'qualification': 'MBBS, MD, DM Cardiology',
                'experience_years': 18,
                'consultation_fee': 1200,
            },
            {
                'hospital': hospital,
                'name': 'Ananya Reddy',
                'phone_number': '9876500003',
                'email': 'ananya@cityhospital.com',
                'specialization': 'Pediatrician',
                'qualification': 'MBBS, DCH',
                'experience_years': 8,
                'consultation_fee': 600,
            },
            {
                'hospital': hospital,
                'name': 'Vikram Singh',
                'phone_number': '9876500004',
                'email': 'vikram@cityhospital.com',
                'specialization': 'Orthopedic Surgeon',
                'qualification': 'MBBS, MS Ortho',
                'experience_years': 15,
                'consultation_fee': 900,
            },
        ]

        for doc_data in doctors_data:
            doctor, created = Doctor.objects.get_or_create(
                name=doc_data['name'],
                hospital=doc_data['hospital'],
                defaults=doc_data,
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created doctor: Dr. {doctor.name}'))

        # ── 6. Create Appointments ──
        now = timezone.now()
        doctor1 = Doctor.objects.filter(name='Priya Sharma').first()
        doctor2 = Doctor.objects.filter(name='Rahul Patel').first()

        if doctor1 and doctor2 and patient:
            apt1, created = Appointment.objects.get_or_create(
                patient=patient,
                doctor=doctor1,
                hospital=hospital,
                defaults={
                    'appointment_date': now + timedelta(days=1, hours=4),
                    'reason': 'General checkup',
                    'status': 'scheduled',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('  ✓ Created appointment with Dr. Priya Sharma'))

            apt2, created = Appointment.objects.get_or_create(
                patient=patient,
                doctor=doctor2,
                hospital=hospital2,
                defaults={
                    'appointment_date': now + timedelta(days=7, hours=8),
                    'reason': 'Cardiac consultation',
                    'status': 'scheduled',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS('  ✓ Created appointment with Dr. Rahul Patel'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Demo credentials:')
        self.stdout.write(f'  Patient:  9876543210  (Aadhar: 123456789012)')
        self.stdout.write(f'  Hospital: 9876543211  (Aadhar: 123456789013)')
        self.stdout.write(f'  Pharmacy: 9876543212  (Aadhar: 123456789014)')
        self.stdout.write(f'  Admin:    9876543213  (Aadhar: 123456789015)')
        self.stdout.write('')
