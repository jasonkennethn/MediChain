"""
MediChain API Views
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Hospital, Pharmacy, Doctor, Patient, Appointment, PharmacyInventory, PharmacyOrder
from .serializers import (
    UserSerializer, LoginSerializer, RegisterSerializer,
    HospitalSerializer, HospitalListSerializer, PharmacySerializer,
    DoctorSerializer, PatientSerializer, AppointmentSerializer,
    PharmacyInventorySerializer, PharmacyOrderSerializer
)


def get_tokens_for_user(user):
    """Generate JWT token pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login via phone number or Aadhar number.
    If user exists → return JWT tokens + user data.
    If not → return error suggesting registration.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    login_type = serializer.validated_data['type']
    value = serializer.validated_data['value']

    try:
        if login_type == 'phone':
            user = User.objects.get(phone_number=value)
        else:
            user = User.objects.get(aadhar_number=value)
    except User.DoesNotExist:
        label = 'Phone Number' if login_type == 'phone' else 'Aadhar Number'
        return Response(
            {
                'success': False,
                'error': f'This {label} does not exist, Register Now',
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    tokens = get_tokens_for_user(user)
    user_data = UserSerializer(user).data

    return Response({
        'success': True,
        'user': user_data,
        'tokens': tokens,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Register a new user. Creates the user + associated profile
    (Patient, Hospital, or Pharmacy) based on the role.
    """
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    user = User.objects.create_user(
        phone_number=data['phone_number'],
        name=data['name'],
        role=data.get('role', 'patient'),
        aadhar_number=data.get('aadhar_number') or None,
        email=data.get('email') or None,
    )

    # Create role-specific profile
    if user.role == 'patient':
        Patient.objects.create(user=user)
    elif user.role == 'hospital':
        Hospital.objects.create(
            admin=user,
            hospital_name=user.name,
            registration_number=f"REG-{user.phone_number}",
            address="Please update your address",
            city="Please update your city",
            state="Please update your state",
            pincode="000000",
            phone=user.phone_number,
            email=user.email,
            is_verified=True, # Auto-verify in dev
        )
    elif user.role == 'pharmacy':
        Pharmacy.objects.create(
            admin=user,
            pharmacy_name=user.name,
            license_number=f"LIC-{user.phone_number}",
            address="Please update your address",
            city="Please update your city",
            state="Please update your state",
            pincode="000000",
            phone=user.phone_number,
            email=user.email,
            is_verified=True,
        )

    tokens = get_tokens_for_user(user)
    user_data = UserSerializer(user).data

    return Response({
        'success': True,
        'user': user_data,
        'tokens': tokens,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Return or update the authenticated user's profile."""
    user = request.user
    
    if request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        user_serializer = UserSerializer(user, data=request.data, partial=partial)
        if user_serializer.is_valid():
            user_serializer.save()
            
            profile_data_req = request.data.get('profile', {})
            # Update role-specific profile
            if user.role == 'patient':
                try:
                    profile = user.patient_profile
                    profile_serializer = PatientSerializer(profile, data=profile_data_req, partial=partial)
                    if profile_serializer.is_valid():
                        profile_serializer.save()
                except Patient.DoesNotExist:
                    pass
            elif user.role == 'hospital':
                try:
                    profile = user.hospital_profile
                    profile_serializer = HospitalSerializer(profile, data=profile_data_req, partial=partial)
                    if profile_serializer.is_valid():
                        profile_serializer.save()
                except Hospital.DoesNotExist:
                    pass
            elif user.role == 'pharmacy':
                try:
                    profile = user.pharmacy_profile
                    profile_serializer = PharmacySerializer(profile, data=profile_data_req, partial=partial)
                    if profile_serializer.is_valid():
                        profile_serializer.save()
                except Pharmacy.DoesNotExist:
                    pass
        else:
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_data = UserSerializer(user).data

    # Attach role-specific profile data
    profile_data = None
    if user.role == 'patient':
        try:
            profile_data = PatientSerializer(user.patient_profile).data
        except Patient.DoesNotExist:
            pass
    elif user.role == 'hospital':
        try:
            profile_data = HospitalSerializer(user.hospital_profile).data
        except Hospital.DoesNotExist:
            pass
    elif user.role == 'pharmacy':
        try:
            profile_data = PharmacySerializer(user.pharmacy_profile).data
        except Pharmacy.DoesNotExist:
            pass

    return Response({
        'success': True,
        'user': user_data,
        'profile': profile_data,
    })


class HospitalListView(generics.ListAPIView):
    """List all available hospitals (public endpoint)."""
    queryset = Hospital.objects.filter(is_verified=True)
    serializer_class = HospitalListSerializer
    permission_classes = [AllowAny]


class HospitalDetailView(generics.RetrieveAPIView):
    """Get details of a single hospital."""
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [AllowAny]


class DoctorListCreateView(generics.ListCreateAPIView):
    """List doctors — optionally filter by hospital. Create doctors for hospital admins."""
    serializer_class = DoctorSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        queryset = Doctor.objects.all()
        # Non-hospital-admins only see available doctors
        if not (self.request.user.is_authenticated and self.request.user.role == 'hospital'):
            queryset = queryset.filter(is_available=True)
            
        hospital_id = self.request.query_params.get('hospital')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'hospital':
            try:
                serializer.save(hospital=user.hospital_profile)
            except Hospital.DoesNotExist:
                from rest_framework.exceptions import ValidationError
                raise ValidationError("Hospital profile not found for this user.")
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only hospital admin can add doctors.")


class DoctorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a doctor."""
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_update(self, serializer):
        user = self.request.user
        doctor = self.get_object()
        if user.role == 'hospital' and doctor.hospital == user.hospital_profile:
            serializer.save()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to modify this doctor.")

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role == 'hospital' and instance.hospital == user.hospital_profile:
            instance.delete()
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete this doctor.")


class AppointmentListCreateView(generics.ListCreateAPIView):
    """List and create appointments for the authenticated user."""
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            try:
                return Appointment.objects.filter(patient=user.patient_profile)
            except Patient.DoesNotExist:
                return Appointment.objects.none()
        elif user.role == 'hospital':
            # Check if this is a doctor staff member
            try:
                staff = HospitalStaff.objects.get(user=user)
                if staff.role == 'doctor':
                    try:
                        doctor = Doctor.objects.get(user=user)
                        return Appointment.objects.filter(doctor=doctor)
                    except Doctor.DoesNotExist:
                        return Appointment.objects.none()
            except HospitalStaff.DoesNotExist:
                pass
            # Hospital admin/owner
            try:
                return Appointment.objects.filter(hospital=user.hospital_profile)
            except Hospital.DoesNotExist:
                return Appointment.objects.none()
        elif user.role == 'admin':
            return Appointment.objects.all()
        return Appointment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'patient':
            try:
                serializer.save(patient=user.patient_profile)
            except Patient.DoesNotExist:
                pass
        else:
            serializer.save()


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete an appointment."""
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'patient':
            try:
                return Appointment.objects.filter(patient=user.patient_profile)
            except Patient.DoesNotExist:
                return Appointment.objects.none()
        elif user.role == 'hospital':
            # Check if this is a doctor staff member
            try:
                staff = HospitalStaff.objects.get(user=user)
                if staff.role == 'doctor':
                    try:
                        doctor = Doctor.objects.get(user=user)
                        return Appointment.objects.filter(doctor=doctor)
                    except Doctor.DoesNotExist:
                        return Appointment.objects.none()
            except HospitalStaff.DoesNotExist:
                pass
            # Hospital admin/owner
            try:
                return Appointment.objects.filter(hospital=user.hospital_profile)
            except Hospital.DoesNotExist:
                return Appointment.objects.none()
        elif user.role == 'admin':
            return Appointment.objects.all()
        return Appointment.objects.none()

    def perform_update(self, serializer):
        user = self.request.user
        # Optional: restrict certain updates (like reason) to patients only
        # or notes to hospitals only. For simplicity, we allow authorized users to update.
        serializer.save()


class PharmacyListView(generics.ListAPIView):
    """List pharmacies (public endpoint)."""
    queryset = Pharmacy.objects.filter(is_verified=True)
    serializer_class = PharmacySerializer
    permission_classes = [AllowAny]


class AdminHospitalListView(generics.ListAPIView):
    """List all hospitals for admin verification."""
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can access this list.")
        return Hospital.objects.all()


class AdminPharmacyListView(generics.ListAPIView):
    """List all pharmacies for admin verification."""
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can access this list.")
        return Pharmacy.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_entity_view(request, entity_type, entity_id):
    """Verify or unverify a hospital or pharmacy. Only admins can do this."""
    if request.user.role != 'admin':
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Only platform admins can verify entities.")
        
    try:
        if entity_type == 'hospital':
            entity = Hospital.objects.get(id=entity_id)
            entity.is_verified = request.data.get('is_verified', True)
            entity.save()
            return Response({'success': True, 'is_verified': entity.is_verified})
        elif entity_type == 'pharmacy':
            entity = Pharmacy.objects.get(id=entity_id)
            entity.is_verified = request.data.get('is_verified', True)
            entity.save()
            return Response({'success': True, 'is_verified': entity.is_verified})
        else:
            return Response({'success': False, 'error': 'Invalid entity type'}, status=400)
    except (Hospital.DoesNotExist, Pharmacy.DoesNotExist):
        return Response({'success': False, 'error': 'Entity not found'}, status=404)


class PharmacyInventoryListCreateView(generics.ListCreateAPIView):
    """List and create pharmacy inventory."""
    serializer_class = PharmacyInventorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'pharmacy':
            try:
                return PharmacyInventory.objects.filter(pharmacy=user.pharmacy_profile)
            except Pharmacy.DoesNotExist:
                return PharmacyInventory.objects.none()
        return PharmacyInventory.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'pharmacy':
            try:
                serializer.save(pharmacy=user.pharmacy_profile)
            except Pharmacy.DoesNotExist:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Pharmacy profile not found.")
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only pharmacies can add inventory.")


class PharmacyOrderListCreateView(generics.ListCreateAPIView):
    """List and create pharmacy orders."""
    serializer_class = PharmacyOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'pharmacy':
            try:
                return PharmacyOrder.objects.filter(pharmacy=user.pharmacy_profile)
            except Pharmacy.DoesNotExist:
                return PharmacyOrder.objects.none()
        return PharmacyOrder.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'pharmacy':
            try:
                serializer.save(pharmacy=user.pharmacy_profile)
            except Pharmacy.DoesNotExist:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Pharmacy profile not found.")
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only pharmacies can create orders.")


class PharmacyOrderDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update pharmacy order (e.g. change status to dispensed)."""
    queryset = PharmacyOrder.objects.all()
    serializer_class = PharmacyOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'pharmacy':
            try:
                return PharmacyOrder.objects.filter(pharmacy=user.pharmacy_profile)
            except Pharmacy.DoesNotExist:
                return PharmacyOrder.objects.none()
        return PharmacyOrder.objects.none()


from rest_framework.views import APIView
from django.db.models import Count, Sum
from datetime import timedelta
from django.utils import timezone
from .models import HospitalStaff
from .serializers import HospitalStaffSerializer

class HospitalStaffListCreateView(APIView):
    """List and create hospital staff. (For Hospital Admins)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'hospital':
            return Response({'error': 'Unauthorized'}, status=403)
        # Find hospital: either user is the owner or a staff member
        hospital = None
        try:
            hospital = user.hospital_profile
        except Hospital.DoesNotExist:
            # User might be a staff member
            try:
                staff_record = HospitalStaff.objects.get(user=user)
                hospital = staff_record.hospital
            except HospitalStaff.DoesNotExist:
                pass
        if not hospital:
            return Response([], status=200)
        staff = HospitalStaff.objects.filter(hospital=hospital)
        return Response(HospitalStaffSerializer(staff, many=True).data)

    def post(self, request):
        user = request.user
        if user.role != 'hospital':
            return Response({'error': 'Unauthorized'}, status=403)
        
        try:
            hospital = user.hospital_profile
        except Hospital.DoesNotExist:
            return Response({'error': 'Hospital not found'}, status=404)

        data = request.data
        phone = data.get('phone_number')
        name = data.get('name')
        role = data.get('role', 'doctor')
        
        # Check if user exists
        try:
            staff_user = User.objects.get(phone_number=phone)
        except User.DoesNotExist:
            staff_user = User.objects.create_user(
                phone_number=phone,
                name=name,
                role='hospital', # General role
                email=data.get('email')
            )
            staff_user.set_unusable_password()
            staff_user.save()
            
        # Create staff record
        staff, created = HospitalStaff.objects.get_or_create(
            hospital=hospital,
            user=staff_user,
            defaults={'role': role}
        )
        
        # If doctor role, create Doctor profile too
        if role == 'doctor':
            Doctor.objects.get_or_create(
                hospital=hospital,
                user=staff_user,
                defaults={
                    'name': name,
                    'specialization': data.get('specialization', 'General'),
                    'qualification': data.get('qualification', ''),
                    'experience_years': data.get('experience_years', 0),
                    'consultation_fee': data.get('consultation_fee', 0),
                    'is_available': data.get('is_available', True),
                }
            )

        return Response(HospitalStaffSerializer(staff).data, status=201)

class HospitalStaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete hospital staff."""
    serializer_class = HospitalStaffSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'hospital':
            try:
                return HospitalStaff.objects.filter(hospital=user.hospital_profile)
            except Hospital.DoesNotExist:
                return HospitalStaff.objects.none()
        return HospitalStaff.objects.none()
        
    def perform_update(self, serializer):
        instance = serializer.save()
        if 'is_active' in self.request.data:
            user = instance.user
            user.is_active = instance.is_active
            user.save()

    def perform_destroy(self, instance):
        if instance.role == 'doctor':
            Doctor.objects.filter(user=instance.user).delete()
        instance.delete()


class HospitalAnalyticsView(APIView):
    """Get hospital analytics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'hospital':
            return Response({'error': 'Unauthorized'}, status=403)
        # Find hospital: either user is the owner or a staff member
        hospital = None
        try:
            hospital = user.hospital_profile
        except Hospital.DoesNotExist:
            try:
                staff_record = HospitalStaff.objects.get(user=user)
                hospital = staff_record.hospital
            except HospitalStaff.DoesNotExist:
                pass
        if not hospital:
            return Response({'error': 'Hospital not found'}, status=404)

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        
        appointments = Appointment.objects.filter(hospital=hospital)
        
        # Total counts
        total_appointments = appointments.count()
        total_doctors = Doctor.objects.filter(hospital=hospital).count()
        total_patients = appointments.values('patient').distinct().count()
        
        # Appointments by status
        status_counts = appointments.values('status').annotate(count=Count('id'))
        
        # Revenue estimate (Assuming doctors have fee and completed appointments)
        revenue = sum([
            apt.doctor.consultation_fee for apt in appointments.filter(status='completed')
            if apt.doctor.consultation_fee
        ])

        return Response({
            'total_appointments': total_appointments,
            'total_doctors': total_doctors,
            'total_patients': total_patients,
            'revenue': revenue,
            'status_breakdown': status_counts,
        })

class FeedbackCreateView(generics.CreateAPIView):
    """Create feedback from any authenticated user."""
    from .serializers import FeedbackSerializer
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PatientLookupView(APIView):
    """Lookup a patient by phone or Aadhar number. Returns full patient record with past visits."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'hospital':
            return Response({'error': 'Unauthorized'}, status=403)

        phone = request.query_params.get('phone')
        aadhar = request.query_params.get('aadhar')

        if not phone and not aadhar:
            return Response({'error': 'Provide phone or aadhar query parameter'}, status=400)

        try:
            if phone:
                target_user = User.objects.get(phone_number=phone, role='patient')
            else:
                target_user = User.objects.get(aadhar_number=aadhar, role='patient')

            patient = target_user.patient_profile
            from .serializers import PatientDetailSerializer
            return Response({
                'success': True,
                'patient': PatientDetailSerializer(patient).data
            })
        except User.DoesNotExist:
            return Response({'success': False, 'error': 'Patient not found'}, status=404)
        except Patient.DoesNotExist:
            return Response({'success': False, 'error': 'Patient profile not found'}, status=404)


class DoctorAnalyticsView(APIView):
    """Get visit analytics for the logged-in doctor."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != 'hospital':
            return Response({'error': 'Unauthorized'}, status=403)

        # Find the doctor profile for this user
        try:
            doctor = Doctor.objects.get(user=user)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor profile not found'}, status=404)

        now = timezone.now()

        # Daily visits (last 7 days)
        daily_visits = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            count = Appointment.objects.filter(
                doctor=doctor,
                appointment_date__date=day.date()
            ).count()
            daily_visits.append({
                'date': day.strftime('%a %d'),
                'count': count
            })

        # Monthly visits (last 6 months)
        monthly_visits = []
        for i in range(5, -1, -1):
            month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
            if i == 0:
                month_end = now
            else:
                month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            count = Appointment.objects.filter(
                doctor=doctor,
                appointment_date__gte=month_start,
                appointment_date__lt=month_end
            ).count()
            monthly_visits.append({
                'month': month_start.strftime('%b %Y'),
                'count': count
            })

        # Total stats
        total_patients = Appointment.objects.filter(doctor=doctor).values('patient').distinct().count()
        total_completed = Appointment.objects.filter(doctor=doctor, status='completed').count()
        total_scheduled = Appointment.objects.filter(doctor=doctor, status='scheduled').count()

        return Response({
            'daily_visits': daily_visits,
            'monthly_visits': monthly_visits,
            'total_patients': total_patients,
            'total_completed': total_completed,
            'total_scheduled': total_scheduled,
        })


class DoctorToggleAvailabilityView(APIView):
    """Toggle doctor availability."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            doctor = Doctor.objects.get(pk=pk)
            doctor.is_available = not doctor.is_available
            doctor.save()
            return Response({'success': True, 'is_available': doctor.is_available})
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor not found'}, status=404)


class StaffToggleAccessView(APIView):
    """Toggle staff access (activate/deactivate)."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role != 'hospital':
            return Response({'error': 'Unauthorized'}, status=403)
        try:
            staff = HospitalStaff.objects.get(pk=pk)
            staff.is_active = not staff.is_active
            staff.save()
            # Also toggle the user's active status
            staff_user = staff.user
            staff_user.is_active = staff.is_active
            staff_user.save()
            return Response({'success': True, 'is_active': staff.is_active})
        except HospitalStaff.DoesNotExist:
            return Response({'error': 'Staff not found'}, status=404)


class ConfigKeysView(APIView):
    """Exposes configuration keys (Gemini, Groq) securely to authenticated requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.conf import settings
        return Response({
            'gemini_api_key': getattr(settings, 'GEMINI_API_KEY', ''),
            'groq_api_key': getattr(settings, 'GROQ_API_KEY', '')
        })


class PharmacyInventoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a pharmacy inventory item."""
    queryset = PharmacyInventory.objects.all()
    serializer_class = PharmacyInventorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'pharmacy':
            try:
                return PharmacyInventory.objects.filter(pharmacy=user.pharmacy_profile)
            except Pharmacy.DoesNotExist:
                return PharmacyInventory.objects.none()
        return PharmacyInventory.objects.none()

