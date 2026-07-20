from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DoctorViewSet,
    PatientViewSet,
    AppointmentViewSet,
    BillViewSet,
    UserProfileView,
    PasswordChangeView,
    NotificationViewSet,
    DashboardAnalyticsView,
    MedicalHistoryViewSet,
    MedicineViewSet,
    PaymentViewSet,
    RoomViewSet,
    BedViewSet,
    PatientBedAllocationViewSet,
    TransferHistoryViewSet,
    PrescriptionViewSet,
    ReportViewSet,
    RegisterView,
)

router = DefaultRouter()
router.register(r'doctors', DoctorViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'bills', BillViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'rooms', RoomViewSet)
router.register(r'beds', BedViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'allocations', PatientBedAllocationViewSet, basename='allocation')
router.register(r'transfers', TransferHistoryViewSet, basename='transfer')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'medical-histories', MedicalHistoryViewSet, basename='medical-history')
router.register(r'medicines', MedicineViewSet, basename='medicine')
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('dashboard/analytics/', DashboardAnalyticsView.as_view(), name='dashboard-analytics'),
    path('register/', RegisterView.as_view(), name='register'),
]