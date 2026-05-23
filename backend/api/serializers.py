"""
MediChain API Serializers
"""

from rest_framework import serializers
from .models import User, Hospital, HospitalStaff, Pharmacy, Doctor, Patient, Appointment, PharmacyInventory, PharmacyOrder, Feedback


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model."""

    staff_role = serializers.SerializerMethodField()
    doctor_profile_id = serializers.SerializerMethodField()
    hospital_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'name', 'phone_number', 'aadhar_number',
            'email', 'role', 'staff_role', 'doctor_profile_id', 'hospital_id',
            'is_active', 'avatar', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_staff_role(self, obj):
        if obj.role == 'hospital':
            # Check if they are a specific staff member
            try:
                staff = HospitalStaff.objects.get(user=obj)
                return staff.role
            except HospitalStaff.DoesNotExist:
                # If they own the Hospital object directly, they are a primary admin
                try:
                    if Hospital.objects.filter(admin=obj).exists():
                        return 'admin'
                except Exception:
                    pass
        return None

    def get_doctor_profile_id(self, obj):
        if obj.role == 'hospital':
            try:
                return str(obj.doctor_profile.id)
            except Exception:
                pass
        return None

    def get_hospital_id(self, obj):
        if obj.role == 'hospital':
            try:
                return str(obj.doctor_profile.hospital.id)
            except Exception:
                pass
            try:
                return str(HospitalStaff.objects.get(user=obj).hospital.id)
            except Exception:
                pass
            try:
                return str(obj.hospital_profile.id)
            except Exception:
                pass
        return None


class PatientSerializer(serializers.ModelSerializer):
    """Serializer for the Patient model."""
    user = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'date_of_birth', 'gender', 'blood_group',
            'address', 'city', 'state', 'pincode', 'emergency_contact',
            'medical_history', 'allergies',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientDetailSerializer(serializers.ModelSerializer):
    """Detailed Patient serializer with past visit history for doctor lookup."""
    user = UserSerializer(read_only=True)
    past_visits = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'date_of_birth', 'gender', 'blood_group',
            'address', 'city', 'state', 'pincode', 'emergency_contact',
            'medical_history', 'allergies', 'past_visits',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_past_visits(self, obj):
        from .models import Appointment
        appointments = Appointment.objects.filter(patient=obj).order_by('-appointment_date')[:20]
        return [{
            'id': str(apt.id),
            'doctor_name': apt.doctor.name,
            'doctor_specialization': apt.doctor.specialization,
            'hospital_name': apt.hospital.hospital_name,
            'appointment_date': apt.appointment_date.isoformat(),
            'status': apt.status,
            'reason': apt.reason,
            'symptoms': apt.symptoms,
            'diagnosis': apt.diagnosis,
            'prescription_data': apt.prescription_data,
            'follow_up_instructions': apt.follow_up_instructions,
            'tests_advised': apt.tests_advised,
            'notes': apt.notes,
        } for apt in appointments]


class HospitalSerializer(serializers.ModelSerializer):
    """Serializer for the Hospital model."""
    admin = UserSerializer(read_only=True)

    class Meta:
        model = Hospital
        fields = [
            'id', 'admin', 'hospital_name', 'registration_number',
            'address', 'city', 'state', 'pincode', 'phone', 'email',
            'specializations', 'facilities', 'is_verified',
            'logo', 'prescription_header', 'prescription_footer', 'prescription_layout',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class HospitalStaffSerializer(serializers.ModelSerializer):
    """Serializer for HospitalStaff model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = HospitalStaff
        fields = [
            'id', 'hospital', 'user', 'role', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class HospitalListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing hospitals (no nested admin)."""
    doctor_count = serializers.SerializerMethodField()

    class Meta:
        model = Hospital
        fields = [
            'id', 'hospital_name', 'registration_number',
            'address', 'city', 'state', 'pincode', 'phone', 'email',
            'specializations', 'facilities', 'is_verified', 'doctor_count',
        ]

    def get_doctor_count(self, obj):
        return obj.doctors.count()


class PharmacySerializer(serializers.ModelSerializer):
    """Serializer for the Pharmacy model."""
    admin = UserSerializer(read_only=True)

    class Meta:
        model = Pharmacy
        fields = [
            'id', 'admin', 'pharmacy_name', 'license_number',
            'address', 'city', 'state', 'pincode', 'phone', 'email',
            'is_verified', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DoctorSerializer(serializers.ModelSerializer):
    """Serializer for the Doctor model."""
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'hospital', 'hospital_name', 'name', 'phone_number', 'email',
            'specialization', 'qualification', 'experience_years',
            'consultation_fee', 'is_available', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'hospital', 'created_at', 'updated_at']

class FeedbackSerializer(serializers.ModelSerializer):
    """Serializer for the Feedback model."""
    class Meta:
        model = Feedback
        fields = ['id', 'user', 'message', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer for the Appointment model."""
    patient_name = serializers.CharField(source='patient.user.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.hospital_name', read_only=True)
    doctor_specialization = serializers.CharField(source='doctor.specialization', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'doctor_specialization', 'hospital', 'hospital_name',
            'appointment_date', 'reason', 'status', 'notes',
            'symptoms', 'diagnosis', 'prescription_data',
            'follow_up_instructions', 'tests_advised', 'transcript',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'patient': {'required': False, 'allow_null': True}
        }



class LoginSerializer(serializers.Serializer):
    """Serializer for login — accepts phone or aadhar."""
    type = serializers.ChoiceField(choices=['phone', 'aadhar'])
    value = serializers.CharField(max_length=12)

    def validate_value(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Must contain only digits.')
        return value

    def validate(self, data):
        if data['type'] == 'phone' and len(data['value']) != 10:
            raise serializers.ValidationError({'value': 'Phone number must be exactly 10 digits.'})
        if data['type'] == 'aadhar' and len(data['value']) != 12:
            raise serializers.ValidationError({'value': 'Aadhar number must be exactly 12 digits.'})
        return data


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration."""
    name = serializers.CharField(max_length=255)
    phone_number = serializers.CharField(max_length=10)
    aadhar_number = serializers.CharField(max_length=12, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=['patient', 'hospital', 'pharmacy'], default='patient')

    def validate_phone_number(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError('Phone number must be exactly 10 digits.')
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError('This phone number is already registered.')
        return value

    def validate_aadhar_number(self, value):
        if value:
            if not value.isdigit() or len(value) != 12:
                raise serializers.ValidationError('Aadhar number must be exactly 12 digits.')
            if User.objects.filter(aadhar_number=value).exists():
                raise serializers.ValidationError('This Aadhar number is already registered.')
        return value


class PharmacyInventorySerializer(serializers.ModelSerializer):
    """Serializer for Pharmacy Inventory."""
    pharmacy_name = serializers.CharField(source='pharmacy.pharmacy_name', read_only=True)

    class Meta:
        model = PharmacyInventory
        fields = [
            'id', 'pharmacy', 'pharmacy_name', 'medicine_name', 
            'stock_quantity', 'location', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'pharmacy', 'created_at', 'updated_at']


class PharmacyOrderSerializer(serializers.ModelSerializer):
    """Serializer for Pharmacy Orders."""
    pharmacy_name = serializers.CharField(source='pharmacy.pharmacy_name', read_only=True)

    class Meta:
        model = PharmacyOrder
        fields = [
            'id', 'pharmacy', 'pharmacy_name', 'patient_name', 
            'medicine_name', 'quantity', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'pharmacy', 'created_at', 'updated_at']
