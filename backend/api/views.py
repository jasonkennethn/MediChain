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
