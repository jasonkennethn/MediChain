"""
MediChain API URL Configuration
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.profile_view, name='profile'),

    # Hospitals
    path('hospitals/', views.HospitalListView.as_view(), name='hospital-list'),
    path('hospitals/<uuid:pk>/', views.HospitalDetailView.as_view(), name='hospital-detail'),

    # Doctors
    path('doctors/', views.DoctorListCreateView.as_view(), name='doctor-list'),
    path('doctors/<uuid:pk>/', views.DoctorDetailView.as_view(), name='doctor-detail'),

    # Pharmacies
    path('pharmacies/', views.PharmacyListView.as_view(), name='pharmacy-list'),

    # Admin Verification urls
    path('admin/hospitals/', views.AdminHospitalListView.as_view(), name='admin-hospital-list'),
    path('admin/pharmacies/', views.AdminPharmacyListView.as_view(), name='admin-pharmacy-list'),
    path('admin/verify/<str:entity_type>/<uuid:entity_id>/', views.verify_entity_view, name='verify-entity'),

    # Appointments
    path('appointments/', views.AppointmentListCreateView.as_view(), name='appointment-list'),
    path('appointments/<uuid:pk>/', views.AppointmentDetailView.as_view(), name='appointment-detail'),
]
