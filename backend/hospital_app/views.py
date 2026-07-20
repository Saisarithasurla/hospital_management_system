from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action

from .models import Doctor, Patient, Appointment, Bill, Notification, MedicalHistory, Medicine, Payment, Room, Bed, PatientBedAllocation, TransferHistory, notify_all, Prescription, PrescriptionMedicine, Profile
from .serializers import (
    DoctorSerializer,
    PatientSerializer,
    AppointmentSerializer,
    BillSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer,
    NotificationSerializer,
    MedicalHistorySerializer,
    MedicineSerializer,
    PaymentSerializer,
    RoomSerializer,
    BedSerializer,
    PatientBedAllocationSerializer,
    TransferHistorySerializer,
    PrescriptionSerializer,
    PrescriptionMedicineSerializer,
)


from django.db.models import Sum, Count, Q, Avg, F
import datetime
from .permissions import RoleBasedPermission


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = Doctor.objects.all()
        
        # Filter by availability_status
        status = self.request.query_params.get('availability_status')
        if status:
            queryset = queryset.filter(availability_status=status)
            
        # Search by name or specialization
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(specialization__icontains=search)
            )
        return queryset

    def perform_update(self, serializer):
        try:
            role = self.request.user.profile.role
        except Exception:
            role = 'Admin' if self.request.user.is_superuser else 'Receptionist'

        if 'availability_status' in serializer.validated_data:
            if role != 'Admin':
                raise ValidationError({"detail": "Only admin users are allowed to update doctor availability status."})

        serializer.save()


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]



class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        user = request.user
        username = request.data.get("username")
        email = request.data.get("email")

        if username:
            if User.objects.exclude(pk=user.pk).filter(username=username).exists():
                return Response({"username": ["This username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username

        if email:
            if User.objects.exclude(pk=user.pk).filter(email=email).exists():
                return Response({"email": ["This email is already in use."]}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email

        user.save()
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        return self.put(request)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        email = request.data.get("email")
        role = request.data.get("role", "Receptionist")

        if not username or not password or not email:
            return Response({"detail": "Username, password and email are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"username": ["This username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"email": ["This email is already in use."]}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create_user(username=username, email=email, password=password)
        
        # Get or create profile and update role
        profile, created = Profile.objects.get_or_create(user=user)
        profile.role = role
        profile.save()

        return Response({"detail": "User registered successfully."}, status=status.HTTP_201_CREATED)



class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["current_password"]):
                return Response({"current_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data["new_password"])
            user.save()
            Notification.objects.create(
                user=user,
                title="Password Changed",
                description="Your password has been changed successfully.",
                notification_type="auth"
            )
            return Response({"detail": "Password updated successfully."})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                Notification.objects.create(
                    user=user,
                    title="User Logged In",
                    description=f"User {user.username} has logged in successfully.",
                    notification_type="auth"
                )
            except Exception:
                pass
        return response

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['patch'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"detail": "Notification marked as read."})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})

    @action(detail=False, methods=['post'], url_path='clear-all')
    def clear_all(self, request):
        Notification.objects.filter(user=request.user).delete()
        return Response({"detail": "All notifications cleared."})


import datetime
from django.utils import timezone
from django.db.models import Sum, Count, Q, F, DecimalField
from django.db.models.functions import TruncMonth

def get_periods(filter_type, start_str=None, end_str=None):
    now = timezone.now()
    today_date = now.date()
    
    if filter_type == 'today':
        curr_start_dt = timezone.make_aware(datetime.datetime.combine(today_date, datetime.time.min))
        curr_end_dt = now
        curr_start_d = today_date
        curr_end_d = today_date
        
        prev_start_dt = curr_start_dt - datetime.timedelta(days=1)
        prev_end_dt = curr_start_dt
        prev_start_d = today_date - datetime.timedelta(days=1)
        prev_end_d = today_date - datetime.timedelta(days=1)
        
    elif filter_type == '7_days':
        curr_start_dt = now - datetime.timedelta(days=7)
        curr_end_dt = now
        curr_start_d = today_date - datetime.timedelta(days=6)
        curr_end_d = today_date
        
        prev_start_dt = now - datetime.timedelta(days=14)
        prev_end_dt = curr_start_dt
        prev_start_d = today_date - datetime.timedelta(days=13)
        prev_end_d = today_date - datetime.timedelta(days=7)
        
    elif filter_type == '30_days':
        curr_start_dt = now - datetime.timedelta(days=30)
        curr_end_dt = now
        curr_start_d = today_date - datetime.timedelta(days=29)
        curr_end_d = today_date
        
        prev_start_dt = now - datetime.timedelta(days=60)
        prev_end_dt = curr_start_dt
        prev_start_d = today_date - datetime.timedelta(days=59)
        prev_end_d = today_date - datetime.timedelta(days=30)
        
    elif filter_type == 'this_month':
        curr_start_dt = timezone.make_aware(datetime.datetime(today_date.year, today_date.month, 1))
        curr_end_dt = now
        curr_start_d = curr_start_dt.date()
        curr_end_d = today_date
        
        if today_date.month == 1:
            prev_year = today_date.year - 1
            prev_month = 12
        else:
            prev_year = today_date.year
            prev_month = today_date.month - 1
        
        prev_start_dt = timezone.make_aware(datetime.datetime(prev_year, prev_month, 1))
        prev_end_dt = curr_start_dt
        prev_start_d = prev_start_dt.date()
        prev_end_d = curr_start_d - datetime.timedelta(days=1)
        
    elif filter_type == 'custom' and start_str and end_str:
        try:
            start_date = datetime.datetime.strptime(start_str, "%Y-%m-%d").date()
            end_date = datetime.datetime.strptime(end_str, "%Y-%m-%d").date()
        except ValueError:
            start_date = today_date
            end_date = today_date
            
        curr_start_dt = timezone.make_aware(datetime.datetime.combine(start_date, datetime.time.min))
        curr_end_dt = timezone.make_aware(datetime.datetime.combine(end_date, datetime.time.max))
        curr_start_d = start_date
        curr_end_d = end_date
        
        delta_days = (end_date - start_date).days
        
        prev_start_d = start_date - datetime.timedelta(days=delta_days + 1)
        prev_end_d = start_date - datetime.timedelta(days=1)
        prev_start_dt = timezone.make_aware(datetime.datetime.combine(prev_start_d, datetime.time.min))
        prev_end_dt = timezone.make_aware(datetime.datetime.combine(prev_end_d, datetime.time.max))
    else:
        return get_periods('30_days')
        
    return {
        'curr_start_dt': curr_start_dt,
        'curr_end_dt': curr_end_dt,
        'curr_start_d': curr_start_d,
        'curr_end_d': curr_end_d,
        'prev_start_dt': prev_start_dt,
        'prev_end_dt': prev_end_dt,
        'prev_start_d': prev_start_d,
        'prev_end_d': prev_end_d,
    }

def pct_change(curr, prev):
    curr = float(curr)
    prev = float(prev)
    if prev == 0.0:
        return 100.0 if curr > 0.0 else 0.0
    return round(((curr - prev) / prev) * 100.0, 1)

class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filter_type = request.query_params.get('filter_type', '30_days')
        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')
        
        periods = get_periods(filter_type, start_str, end_str)
        now = timezone.now()
        today_date = now.date()
        
        # 1. Total Doctors (Static check, but we return count)
        total_doctors = Doctor.objects.count()
        
        # 2. Total Patients
        curr_patients = Patient.objects.filter(created_at__range=(periods['curr_start_dt'], periods['curr_end_dt'])).count()
        prev_patients = Patient.objects.filter(created_at__range=(periods['prev_start_dt'], periods['prev_end_dt'])).count()
        patients_change = pct_change(curr_patients, prev_patients)
        
        # 3. Total Appointments
        curr_appointments = Appointment.objects.filter(appointment_date__range=(periods['curr_start_d'], periods['curr_end_d'])).count()
        prev_appointments = Appointment.objects.filter(appointment_date__range=(periods['prev_start_d'], periods['prev_end_d'])).count()
        appointments_change = pct_change(curr_appointments, prev_appointments)
        
        # 4. Today's Appointments
        curr_appointments_today = Appointment.objects.filter(appointment_date=today_date).count()
        prev_appointments_today = Appointment.objects.filter(appointment_date=today_date - datetime.timedelta(days=1)).count()
        appointments_today_change = pct_change(curr_appointments_today, prev_appointments_today)
        
        # 5. Pending Appointments
        curr_appointments_pending = Appointment.objects.filter(appointment_date__range=(periods['curr_start_d'], periods['curr_end_d']), status='Pending').count()
        prev_appointments_pending = Appointment.objects.filter(appointment_date__range=(periods['prev_start_d'], periods['prev_end_d']), status='Pending').count()
        appointments_pending_change = pct_change(curr_appointments_pending, prev_appointments_pending)
        
        # 6. Completed Appointments
        curr_appointments_completed = Appointment.objects.filter(appointment_date__range=(periods['curr_start_d'], periods['curr_end_d']), status='Completed').count()
        prev_appointments_completed = Appointment.objects.filter(appointment_date__range=(periods['prev_start_d'], periods['prev_end_d']), status='Completed').count()
        appointments_completed_change = pct_change(curr_appointments_completed, prev_appointments_completed)
        
        # 7. Cancelled Appointments
        curr_appointments_cancelled = Appointment.objects.filter(appointment_date__range=(periods['curr_start_d'], periods['curr_end_d']), status='Cancelled').count()
        prev_appointments_cancelled = Appointment.objects.filter(appointment_date__range=(periods['prev_start_d'], periods['prev_end_d']), status='Cancelled').count()
        appointments_cancelled_change = pct_change(curr_appointments_cancelled, prev_appointments_cancelled)
        
        # 8. Total Bills
        curr_bills = Bill.objects.filter(created_at__range=(periods['curr_start_dt'], periods['curr_end_dt'])).count()
        prev_bills = Bill.objects.filter(created_at__range=(periods['prev_start_dt'], periods['prev_end_dt'])).count()
        bills_change = pct_change(curr_bills, prev_bills)
        
        # 9. Pending Bills
        curr_bills_pending = Bill.objects.filter(created_at__range=(periods['curr_start_dt'], periods['curr_end_dt']), payment_status='Pending').count()
        prev_bills_pending = Bill.objects.filter(created_at__range=(periods['prev_start_dt'], periods['prev_end_dt']), payment_status='Pending').count()
        bills_pending_change = pct_change(curr_bills_pending, prev_bills_pending)
        
        # 10. Paid Bills
        curr_bills_paid = Bill.objects.filter(created_at__range=(periods['curr_start_dt'], periods['curr_end_dt']), payment_status='Paid').count()
        prev_bills_paid = Bill.objects.filter(created_at__range=(periods['prev_start_dt'], periods['prev_end_dt']), payment_status='Paid').count()
        bills_paid_change = pct_change(curr_bills_paid, prev_bills_paid)
        
        # 11. Total Revenue
        curr_revenue = Bill.objects.filter(created_at__range=(periods['curr_start_dt'], periods['curr_end_dt']), payment_status='Paid').aggregate(sum_amount=Sum('amount'))['sum_amount'] or 0.0
        prev_revenue = Bill.objects.filter(created_at__range=(periods['prev_start_dt'], periods['prev_end_dt']), payment_status='Paid').aggregate(sum_amount=Sum('amount'))['sum_amount'] or 0.0
        revenue_change = pct_change(curr_revenue, prev_revenue)
        
        # 12. Today's Revenue
        curr_revenue_today = Bill.objects.filter(created_at__date=today_date, payment_status='Paid').aggregate(sum_amount=Sum('amount'))['sum_amount'] or 0.0
        prev_revenue_today = Bill.objects.filter(created_at__date=today_date - datetime.timedelta(days=1), payment_status='Paid').aggregate(sum_amount=Sum('amount'))['sum_amount'] or 0.0
        revenue_today_change = pct_change(curr_revenue_today, prev_revenue_today)
        
        # 13. Monthly Revenue
        curr_revenue_monthly = Bill.objects.filter(created_at__year=today_date.year, created_at__month=today_date.month, payment_status='Paid').aggregate(sum_amount=Sum('amount'))['sum_amount'] or 0.0
        
        prev_month_year = today_date.year if today_date.month > 1 else today_date.year - 1
        prev_month_val = today_date.month - 1 if today_date.month > 1 else 12
        prev_revenue_monthly = Bill.objects.filter(created_at__year=prev_month_year, created_at__month=prev_month_val, payment_status='Paid').aggregate(sum_amount=Sum('amount'))['sum_amount'] or 0.0
        revenue_monthly_change = pct_change(curr_revenue_monthly, prev_revenue_monthly)
        
        # --- CHARTS DATA ---
        # 1. Monthly Revenue (Bar Chart) - Last 6 months
        six_months_ago = today_date - datetime.timedelta(days=180)
        monthly_rev = Bill.objects.filter(created_at__date__gte=six_months_ago, payment_status='Paid').annotate(month=TruncMonth('created_at')).values('month').annotate(revenue=Sum('amount')).order_by('month')
        
        monthly_revenue_data = []
        for entry in monthly_rev:
            if entry['month']:
                monthly_revenue_data.append({
                    'name': entry['month'].strftime('%b %Y'),
                    'revenue': float(entry['revenue'] or 0.0)
                })
                
        # 2. Weekly/Daily Appointments (Line Chart)
        appointments_by_day = Appointment.objects.filter(appointment_date__range=(periods['curr_start_d'], periods['curr_end_d'])).values('appointment_date').annotate(count=Count('id')).order_by('appointment_date')
        
        weekly_appointments_data = []
        curr_d = periods['curr_start_d']
        while curr_d <= periods['curr_end_d']:
            weekly_appointments_data.append({
                'name': curr_d.strftime('%a, %b %d') if filter_type in ['today', '7_days'] else curr_d.strftime('%b %d'),
                'appointments': 0,
                'date_str': curr_d.strftime('%Y-%m-%d')
            })
            curr_d += datetime.timedelta(days=1)
            
        day_map = {entry['appointment_date'].strftime('%Y-%m-%d'): entry['count'] for entry in appointments_by_day}
        for item in weekly_appointments_data:
            item['appointments'] = day_map.get(item['date_str'], 0)
            
        # 3. Doctor-wise Appointments (Pie Chart)
        doctor_appts = Appointment.objects.filter(appointment_date__range=(periods['curr_start_d'], periods['curr_end_d'])).values('doctor__name').annotate(value=Count('id')).order_by('-value')
        doctor_wise_data = [{'name': entry['doctor__name'] or 'Unknown', 'value': entry['value']} for entry in doctor_appts]
        
        # 4. Patient Growth (Area Chart)
        patients_by_day = Patient.objects.filter(created_at__range=(periods['curr_start_dt'], periods['curr_end_dt'])).values('created_at__date').annotate(count=Count('id')).order_by('created_at__date')
        
        patient_growth_data = []
        prior_count = Patient.objects.filter(created_at__lt=periods['curr_start_dt']).count()
        cumulative = prior_count
        
        day_patient_map = {entry['created_at__date'].strftime('%Y-%m-%d'): entry['count'] for entry in patients_by_day if entry['created_at__date']}
        
        curr_d = periods['curr_start_d']
        while curr_d <= periods['curr_end_d']:
            daily_new = day_patient_map.get(curr_d.strftime('%Y-%m-%d'), 0)
            cumulative += daily_new
            patient_growth_data.append({
                'name': curr_d.strftime('%b %d'),
                'new_patients': daily_new,
                'total_patients': cumulative,
                'date_str': curr_d.strftime('%Y-%m-%d')
            })
            curr_d += datetime.timedelta(days=1)
            
        # 5. Appointment Status Distribution (Doughnut Chart)
        status_dist = Appointment.objects.filter(appointment_date__range=(periods['curr_start_d'], periods['curr_end_d'])).values('status').annotate(value=Count('id'))
        appointment_status_data = [{'name': entry['status'], 'value': entry['value']} for entry in status_dist]
        
        # --- WIDGETS ---
        # 1. Top Doctors (Appointments & Revenue generated)
        top_docs_query = Doctor.objects.annotate(
            total_appointments=Count(
                'appointment',
                filter=Q(appointment__appointment_date__range=(periods['curr_start_d'], periods['curr_end_d']))
            ),
            revenue_generated=Sum(
                'appointment__bill__amount',
                filter=Q(
                    appointment__appointment_date__range=(periods['curr_start_d'], periods['curr_end_d']),
                    appointment__bill__payment_status='Paid'
                )
            )
        ).order_by('-total_appointments')[:5]
        
        top_doctors = []
        for doc in top_docs_query:
            top_doctors.append({
                'name': doc.name,
                'appointments': doc.total_appointments,
                'revenue': float(doc.revenue_generated or 0.0)
            })
            
        # 2. Recent Patients (latest 5 registered)
        recent_patients_query = Patient.objects.order_by('-id')[:5]
        recent_patients = []
        for p in recent_patients_query:
            recent_patients.append({
                'name': p.name,
                'age': p.age,
                'gender': p.gender,
                'phone': p.phone,
                'created_at': p.created_at.strftime('%Y-%m-%d %H:%M:%S') if p.created_at else 'N/A'
            })
            
        # 3. Upcoming Appointments (next 5 scheduled)
        upcoming_query = Appointment.objects.filter(appointment_date__gte=today_date).order_by('appointment_date', 'appointment_time')[:5]
        upcoming_appointments = []
        for appt in upcoming_query:
            upcoming_appointments.append({
                'patient_name': appt.patient.name,
                'doctor_name': appt.doctor.name,
                'date': appt.appointment_date.strftime('%Y-%m-%d'),
                'time': appt.appointment_time.strftime('%H:%M'),
                'status': appt.status
            })
            
        # --- QUICK STATISTICS ---
        days_count = (periods['curr_end_d'] - periods['curr_start_d']).days + 1
        days_count = max(days_count, 1)
        
        avg_daily_revenue = round(float(curr_revenue) / days_count, 2)
        avg_appointments_per_day = round(float(curr_appointments) / days_count, 1)
        
        # Doctor utilization: (appointments / (doctors * days * 8)) * 100
        if total_doctors > 0:
            doctor_utilization_rate = round((float(curr_appointments) / (total_doctors * days_count * 8)) * 100.0, 1)
            doctor_utilization_rate = min(doctor_utilization_rate, 100.0)
        else:
            doctor_utilization_rate = 0.0
            
        patient_growth_rate = patients_change
        
        # Combine everything
        data = {
            'summary': {
                'total_doctors': {
                    'value': total_doctors,
                    'change': 0.0
                },
                'total_patients': {
                    'value': Patient.objects.count(), # Return absolute total patients as card value
                    'change': patients_change # growth trend for period
                },
                'total_appointments': {
                    'value': Appointment.objects.count(),
                    'change': appointments_change
                },
                'todays_appointments': {
                    'value': curr_appointments_today,
                    'change': appointments_today_change
                },
                'pending_appointments': {
                    'value': curr_appointments_pending,
                    'change': appointments_pending_change
                },
                'completed_appointments': {
                    'value': curr_appointments_completed,
                    'change': appointments_completed_change
                },
                'cancelled_appointments': {
                    'value': curr_appointments_cancelled,
                    'change': appointments_cancelled_change
                },
                'total_bills': {
                    'value': Bill.objects.count(),
                    'change': bills_change
                },
                'pending_bills': {
                    'value': Bill.objects.filter(payment_status='Pending').count(),
                    'change': bills_pending_change
                },
                'paid_bills': {
                    'value': Bill.objects.filter(payment_status='Paid').count(),
                    'change': bills_paid_change
                },
                'total_revenue': {
                    'value': float(Bill.objects.filter(payment_status='Paid').aggregate(sum_amount=Sum('amount'))['sum_amount'] or 0.0),
                    'change': revenue_change
                },
                'todays_revenue': {
                    'value': float(curr_revenue_today),
                    'change': revenue_today_change
                },
                'monthly_revenue': {
                    'value': float(curr_revenue_monthly),
                    'change': revenue_monthly_change
                },
                'available_doctors': {
                    'value': Doctor.objects.filter(availability_status='Available').count(),
                    'change': 0.0
                },
                'busy_doctors': {
                    'value': Doctor.objects.filter(availability_status='Busy').count(),
                    'change': 0.0
                },
                'on_leave_doctors': {
                    'value': Doctor.objects.filter(availability_status='On Leave').count(),
                    'change': 0.0
                },
                'total_medicines': {
                    'value': Medicine.objects.count(),
                    'change': 0.0
                },
                'total_inventory_value': {
                    'value': float(Medicine.objects.aggregate(total=Sum(F('quantity_in_stock') * F('unit_price'), output_field=DecimalField()))['total'] or 0.0),
                    'change': 0.0
                },
                'low_stock_medicines': {
                    'value': Medicine.objects.filter(quantity_in_stock__gt=0, quantity_in_stock__lte=10).count(),
                    'change': 0.0
                },
                'expiring_medicines': {
                    'value': Medicine.objects.filter(expiry_date__range=(today_date, today_date + datetime.timedelta(days=30))).count(),
                    'change': 0.0
                }
            },
            'charts': {
                'monthly_revenue': monthly_revenue_data,
                'weekly_appointments': weekly_appointments_data,
                'doctor_wise_appointments': doctor_wise_data,
                'patient_growth': patient_growth_data,
                'appointment_status_distribution': appointment_status_data
            },
            'widgets': {
                'top_doctors': top_doctors,
                'recent_patients': recent_patients,
                'upcoming_appointments': upcoming_appointments
            },
            'quick_stats': {
                'avg_daily_revenue': avg_daily_revenue,
                'avg_appointments_per_day': avg_appointments_per_day,
                'doctor_utilization_rate': doctor_utilization_rate,
                'patient_growth_rate': patient_growth_rate
            }
        }
        
        return Response(data)


from rest_framework.exceptions import ValidationError

class MedicalHistoryViewSet(viewsets.ModelViewSet):
    queryset = MedicalHistory.objects.all()
    serializer_class = MedicalHistorySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = MedicalHistory.objects.all().order_by('-visit_date')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(diagnosis__icontains=search) | 
                Q(prescription__icontains=search) | 
                Q(visit_date__icontains=search)
            )
        
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(visit_date__range=(start_date, end_date))
            
        return queryset

    def perform_create(self, serializer):
        patient = serializer.validated_data.get('patient')
        visit_date = serializer.validated_data.get('visit_date')
        if MedicalHistory.objects.filter(patient=patient, visit_date=visit_date).exists():
            raise ValidationError({"visit_date": "A medical history record already exists for this patient on this visit date."})
        serializer.save()

    def perform_update(self, serializer):
        patient = serializer.validated_data.get('patient')
        visit_date = serializer.validated_data.get('visit_date')
        if MedicalHistory.objects.filter(patient=patient, visit_date=visit_date).exclude(pk=serializer.instance.pk).exists():
            raise ValidationError({"visit_date": "A medical history record already exists for this patient on this visit date."})
        serializer.save()


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = Medicine.objects.all()
        
        # Filters
        filter_type = self.request.query_params.get('filter_type')
        today = datetime.date.today()
        if filter_type == 'low_stock':
            queryset = queryset.filter(quantity_in_stock__gt=0, quantity_in_stock__lte=10)
        elif filter_type == 'out_of_stock':
            queryset = queryset.filter(quantity_in_stock=0)
        elif filter_type == 'expiring_30':
            thirty_days_later = today + datetime.timedelta(days=30)
            queryset = queryset.filter(expiry_date__range=(today, thirty_days_later))
            
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(manufacturer__icontains=search) |
                Q(category__icontains=search)
            )
            
        # Sorting
        ordering = self.request.query_params.get('ordering')
        if ordering:
            order_mapping = {
                'name': 'name',
                '-name': '-name',
                'quantity': 'quantity_in_stock',
                '-quantity': '-quantity_in_stock',
                'expiry': 'expiry_date',
                '-expiry': '-expiry_date',
                'price': 'unit_price',
                '-price': '-unit_price',
            }
            db_ordering = order_mapping.get(ordering)
            if db_ordering:
                queryset = queryset.order_by(db_ordering)
                
        return queryset


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = Payment.objects.all().order_by('-payment_date')
        
        # Search by patient name, payment ID, or transaction ID
        search = self.request.query_params.get('search')
        if search:
            q_obj = Q(patient_name__icontains=search) | Q(transaction_id__icontains=search)
            if search.isdigit():
                q_obj |= Q(id=int(search))
            queryset = queryset.filter(q_obj)

        # Filters
        filter_type = self.request.query_params.get('filter_type')
        status_filter = self.request.query_params.get('status')
        
        today = timezone.now().date()
        if filter_type == 'today':
            queryset = queryset.filter(payment_date__date=today)
        elif filter_type == 'this_week':
            start_week = today - datetime.timedelta(days=today.weekday())
            queryset = queryset.filter(payment_date__date__range=(start_week, today))
        elif filter_type == 'this_month':
            queryset = queryset.filter(payment_date__year=today.year, payment_date__month=today.month)
            
        if status_filter:
            queryset = queryset.filter(payment_status=status_filter)

        # Sorting
        ordering = self.request.query_params.get('ordering')
        if ordering:
            order_mapping = {
                'payment_date': 'payment_date',
                '-payment_date': '-payment_date',
                'amount': 'amount',
                '-amount': '-amount',
                'status': 'payment_status',
                '-status': '-payment_status',
            }
            db_ordering = order_mapping.get(ordering)
            if db_ordering:
                queryset = queryset.order_by(db_ordering)

        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        this_month = today.month
        this_year = today.year

        total_payments_count = Payment.objects.count()

        todays_collection = Payment.objects.filter(
            payment_status='Paid',
            payment_date__date=today
        ).aggregate(total=Sum('amount'))['total'] or 0.0

        monthly_collection = Payment.objects.filter(
            payment_status='Paid',
            payment_date__year=this_year,
            payment_date__month=this_month
        ).aggregate(total=Sum('amount'))['total'] or 0.0

        pending_payments_count = Payment.objects.filter(payment_status='Pending').count()

        return Response({
            'total_payments': total_payments_count,
            'todays_collection': float(todays_collection),
            'monthly_collection': float(monthly_collection),
            'pending_payments': pending_payments_count
        })


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = Room.objects.all().order_by('room_number')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(room_number__icontains=search)
            
        room_type = self.request.query_params.get('room_type')
        floor = self.request.query_params.get('floor')
        status = self.request.query_params.get('status')
        
        if room_type:
            queryset = queryset.filter(room_type=room_type)
        if floor:
            queryset = queryset.filter(floor=floor)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_rooms = Room.objects.count()
        available_rooms = Room.objects.filter(status='Available').count()
        occupied_rooms = Room.objects.filter(status='Occupied').count()
        available_beds = Bed.objects.filter(status='Available').count()
        occupied_beds = Bed.objects.filter(status='Occupied').count()

        return Response({
            'total_rooms': total_rooms,
            'available_rooms': available_rooms,
            'occupied_rooms': occupied_rooms,
            'available_beds': available_beds,
            'occupied_beds': occupied_beds,
        })


class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = Bed.objects.all().order_by('bed_number')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(bed_number__icontains=search)
            
        room_id = self.request.query_params.get('room')
        status = self.request.query_params.get('status')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset


class PatientBedAllocationViewSet(viewsets.ModelViewSet):
    queryset = PatientBedAllocation.objects.all()
    serializer_class = PatientBedAllocationSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = PatientBedAllocation.objects.all().order_by('-allocated_at')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(patient__name__icontains=search) | Q(bed__bed_number__icontains=search)
            )
            
        active = self.request.query_params.get('is_active')
        if active == 'true':
            queryset = queryset.filter(is_active=True)
        elif active == 'false':
            queryset = queryset.filter(is_active=False)
            
        return queryset

    def perform_create(self, serializer):
        bed = serializer.validated_data.get('bed')
        patient = serializer.validated_data.get('patient')

        if PatientBedAllocation.objects.filter(patient=patient, is_active=True).exists():
            raise ValidationError({"patient": "This patient is already allocated to a bed."})

        if bed.status != 'Available':
            raise ValidationError({"bed": "This bed is not available."})

        allocation = serializer.save()
        
        bed.status = 'Occupied'
        bed.save()
        
        room = bed.room
        if not room.beds.filter(status='Available').exists():
            room.status = 'Occupied'
            room.save()

    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        allocation = self.get_object()
        if not allocation.is_active:
            raise ValidationError({"detail": "This allocation is already released."})

        allocation.is_active = False
        allocation.released_at = timezone.now()
        allocation.save()

        bed = allocation.bed
        bed.status = 'Available'
        bed.save()

        room = bed.room
        if room.status == 'Occupied':
            room.status = 'Available'
            room.save()

        return Response({"detail": "Patient released from bed successfully."})

    @action(detail=True, methods=['post'])
    def transfer(self, request, pk=None):
        allocation = self.get_object()
        if not allocation.is_active:
            raise ValidationError({"detail": "Cannot transfer a patient from an inactive allocation."})

        to_bed_id = request.data.get('to_bed')
        reason = request.data.get('reason', '')

        if not to_bed_id:
            raise ValidationError({"to_bed": "Target Bed ID is required."})

        try:
            to_bed = Bed.objects.get(pk=to_bed_id)
        except Bed.DoesNotExist:
            raise ValidationError({"to_bed": "Target Bed does not exist."})

        if to_bed.status != 'Available':
            raise ValidationError({"to_bed": "Target Bed is not available."})

        old_bed = allocation.bed
        allocation.is_active = False
        allocation.released_at = timezone.now()
        allocation.save()

        old_bed.status = 'Available'
        old_bed.save()

        old_room = old_bed.room
        if old_room.status == 'Occupied':
            old_room.status = 'Available'
            old_room.save()

        new_allocation = PatientBedAllocation.objects.create(
            patient=allocation.patient,
            bed=to_bed,
            is_active=True
        )

        to_bed.status = 'Occupied'
        to_bed.save()

        new_room = to_bed.room
        if not new_room.beds.filter(status='Available').exists():
            new_room.status = 'Occupied'
            new_room.save()

        TransferHistory.objects.create(
            patient=allocation.patient,
            from_bed=old_bed,
            to_bed=to_bed,
            reason=reason
        )

        notify_all(
            "Patient Transferred",
            f"Patient {allocation.patient.name} was transferred from Bed {old_bed.bed_number} to Bed {to_bed.bed_number}.",
            "patient"
        )

        return Response(PatientBedAllocationSerializer(new_allocation).data)


class TransferHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransferHistory.objects.all()
    serializer_class = TransferHistorySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = TransferHistory.objects.all().order_by('-transfer_date')
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(patient__name__icontains=search) | 
                Q(from_bed__bed_number__icontains=search) | 
                Q(to_bed__bed_number__icontains=search)
            )
            
        return queryset


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = Prescription.objects.all().order_by('-prescription_date', '-id')

        search = self.request.query_params.get('search')
        if search:
            q_obj = Q(patient__name__icontains=search) | Q(doctor__name__icontains=search)
            if search.isdigit():
                q_obj |= Q(id=int(search))
            queryset = queryset.filter(q_obj)

        filter_type = self.request.query_params.get('filter_type')
        doctor_id = self.request.query_params.get('doctor')
        patient_id = self.request.query_params.get('patient')

        today = timezone.now().date()
        if filter_type == 'today':
            queryset = queryset.filter(prescription_date=today)
        elif filter_type == 'this_week':
            start_week = today - datetime.timedelta(days=today.weekday())
            queryset = queryset.filter(prescription_date__range=(start_week, today))
        elif filter_type == 'this_month':
            queryset = queryset.filter(prescription_date__year=today.year, prescription_date__month=today.month)

        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)

        return queryset

    def perform_create(self, serializer):
        medicines_data = self.request.data.get('medicines', [])
        for med in medicines_data:
            med_id = med.get('medicine')
            if not med_id:
                raise ValidationError({"medicines": "Medicine selection is required."})
            try:
                Medicine.objects.get(pk=med_id)
            except Medicine.DoesNotExist:
                raise ValidationError({"medicines": f"Selected medicine ID {med_id} does not exist in inventory."})

        prescription = serializer.save()
        notify_all(
            "Prescription Created",
            f"Prescription #{prescription.id} created for patient {prescription.patient.name} by Dr. {prescription.doctor.name}.",
            "patient"
        )

    def perform_update(self, serializer):
        medicines_data = self.request.data.get('medicines', [])
        if medicines_data:
            for med in medicines_data:
                med_id = med.get('medicine')
                if not med_id:
                    raise ValidationError({"medicines": "Medicine selection is required."})
                try:
                    Medicine.objects.get(pk=med_id)
                except Medicine.DoesNotExist:
                    raise ValidationError({"medicines": f"Selected medicine ID {med_id} does not exist in inventory."})

        prescription = serializer.save()
        notify_all(
            "Prescription Updated",
            f"Prescription #{prescription.id} for patient {prescription.patient.name} was updated.",
            "patient"
        )

    def perform_destroy(self, instance):
        presc_id = instance.id
        patient_name = instance.patient.name
        instance.delete()
        notify_all(
            "Prescription Deleted",
            f"Prescription #{presc_id} for patient {patient_name} was deleted.",
            "patient"
        )

    @action(detail=True, methods=['post'])
    def dispense(self, request, pk=None):
        prescription = self.get_object()
        if prescription.status == 'Dispensed':
            raise ValidationError({"detail": "This prescription has already been dispensed."})

        medicines_to_update = []
        for pm in prescription.medicines.all():
            medicine = pm.medicine
            
            freq_lower = pm.frequency.lower()
            times_per_day = 1
            if "morning/afternoon/night" in freq_lower:
                times_per_day = 3
            elif "morning/night" in freq_lower:
                times_per_day = 2
            elif "morning" in freq_lower or "afternoon" in freq_lower or "night" in freq_lower:
                parts = freq_lower.split('/')
                times_per_day = len([p for p in parts if p.strip() in ['morning', 'afternoon', 'night']])
                if times_per_day == 0:
                    times_per_day = 1
            qty_to_reduce = pm.duration * times_per_day

            if medicine.quantity_in_stock < qty_to_reduce:
                raise ValidationError({
                    "detail": f"Insufficient stock for medicine {medicine.name} in inventory. Available: {medicine.quantity_in_stock}, Required: {qty_to_reduce}."
                })
            
            medicines_to_update.append((medicine, qty_to_reduce))

        for medicine, qty in medicines_to_update:
            medicine.quantity_in_stock -= qty
            medicine.save()

        prescription.status = 'Dispensed'
        prescription.save()

        notify_all(
            "Prescription Dispensed",
            f"Prescription #{prescription.id} for {prescription.patient.name} has been dispensed. Medicine stock updated.",
            "bill"
        )

        return Response(PrescriptionSerializer(prescription).data)


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated, RoleBasedPermission]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total_patients = Patient.objects.count()
        total_doctors = Doctor.objects.count()
        total_appointments = Appointment.objects.count()
        
        total_revenue = Bill.objects.filter(payment_status='Paid').aggregate(Sum('total_amount'))['total_amount__sum'] or 0.0
        
        total_bills = Bill.objects.count()
        total_payments = Payment.objects.count()
        
        inventory_value = 0.0
        for item in Medicine.objects.all():
            inventory_value += float(item.price) * item.quantity_in_stock

        return Response({
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'total_appointments': total_appointments,
            'total_revenue': float(total_revenue),
            'total_bills': total_bills,
            'total_payments': total_payments,
            'inventory_value': inventory_value,
        })

    @action(detail=False, methods=['get'])
    def charts(self, request):
        monthly_revenue = []
        today = timezone.now().date()
        for i in range(5, -1, -1):
            month_date = today - datetime.timedelta(days=i*30)
            year = month_date.year
            month = month_date.month
            
            month_name = month_date.strftime("%b")
            rev = Bill.objects.filter(payment_status='Paid', created_at__year=year, created_at__month=month).aggregate(Sum('total_amount'))['total_amount__sum'] or 0.0
            monthly_revenue.append({
                'name': month_name,
                'revenue': float(rev)
            })

        appointment_trends = []
        for i in range(6, -1, -1):
            date_val = today - datetime.timedelta(days=i)
            date_str = date_val.strftime("%m/%d")
            completed = Appointment.objects.filter(appointment_date=date_val, status='Completed').count()
            pending = Appointment.objects.filter(appointment_date=date_val, status='Pending').count()
            appointment_trends.append({
                'name': date_str,
                'Completed': completed,
                'Pending': pending
            })

        doctor_wise = []
        for doc in Doctor.objects.annotate(appt_count=Count('appointments')).order_by('-appt_count')[:5]:
            doctor_wise.append({
                'name': f"Dr. {doc.name}",
                'value': doc.appt_count
            })

        patient_growth = []
        six_months_ago = today - datetime.timedelta(days=180)
        cumulative = Patient.objects.filter(created_at__lt=six_months_ago).count()
        for i in range(5, -1, -1):
            month_date = today - datetime.timedelta(days=i*30)
            year = month_date.year
            month = month_date.month
            month_name = month_date.strftime("%b")
            new_patients = Patient.objects.filter(created_at__year=year, created_at__month=month).count()
            cumulative += new_patients
            patient_growth.append({
                'name': month_name,
                'patients': cumulative
            })

        inventory_status = []
        for med in Medicine.objects.order_by('-quantity_in_stock')[:7]:
            inventory_status.append({
                'name': med.name,
                'Stock': med.quantity_in_stock
            })

        return Response({
            'monthly_revenue': monthly_revenue,
            'appointment_trends': appointment_trends,
            'doctor_wise_appointments': doctor_wise,
            'patient_growth': patient_growth,
            'inventory_status': inventory_status
        })

    @action(detail=False, methods=['get'])
    def generate(self, request):
        report_type = request.query_params.get('report_type')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        search = request.query_params.get('search')
        
        gender = request.query_params.get('gender')
        specialization = request.query_params.get('specialization')
        status = request.query_params.get('status')
        doctor_id = request.query_params.get('doctor')
        payment_method = request.query_params.get('payment_method')
        inventory_stock = request.query_params.get('inventory_stock')

        start_date = None
        end_date = None
        if start_date_str:
            try:
                start_date = datetime.datetime.strptime(start_date_str, "%Y-%m-%d").date()
            except ValueError:
                pass
        if end_date_str:
            try:
                end_date = datetime.datetime.strptime(end_date_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        data = []

        if report_type == 'patient':
            queryset = Patient.objects.all().order_by('-id')
            if start_date and end_date:
                queryset = queryset.filter(created_at__date__range=(start_date, end_date))
            if gender:
                queryset = queryset.filter(gender=gender)
            if search:
                queryset = queryset.filter(Q(name__icontains=search) | Q(phone__icontains=search))
            
            for item in queryset:
                data.append({
                    'id': item.id,
                    'name': item.name,
                    'age': item.age,
                    'gender': item.gender,
                    'phone': item.phone,
                    'date': item.created_at.strftime("%Y-%m-%d") if item.created_at else "N/A"
                })

        elif report_type == 'doctor':
            queryset = Doctor.objects.all().order_by('-id')
            if specialization:
                queryset = queryset.filter(specialization=specialization)
            if search:
                queryset = queryset.filter(Q(name__icontains=search) | Q(phone__icontains=search))
            
            for item in queryset:
                data.append({
                    'id': item.id,
                    'name': item.name,
                    'specialization': item.specialization,
                    'phone': item.phone,
                    'fees': float(item.consultation_fees)
                })

        elif report_type == 'appointment':
            queryset = Appointment.objects.all().order_by('-appointment_date', '-appointment_time')
            if start_date and end_date:
                queryset = queryset.filter(appointment_date__range=(start_date, end_date))
            if status:
                queryset = queryset.filter(status=status)
            if doctor_id:
                queryset = queryset.filter(doctor_id=doctor_id)
            if search:
                queryset = queryset.filter(Q(patient__name__icontains=search) | Q(doctor__name__icontains=search))

            for item in queryset:
                data.append({
                    'id': item.id,
                    'patient_name': item.patient.name,
                    'doctor_name': f"Dr. {item.doctor.name}",
                    'date': item.appointment_date.strftime("%Y-%m-%d") if item.appointment_date else "N/A",
                    'time': item.appointment_time,
                    'status': item.status
                })

        elif report_type == 'revenue':
            queryset = Bill.objects.filter(payment_status='Paid').order_by('-created_at')
            if start_date and end_date:
                queryset = queryset.filter(created_at__date__range=(start_date, end_date))
            if search:
                queryset = queryset.filter(patient__name__icontains=search)

            for item in queryset:
                data.append({
                    'bill_id': item.id,
                    'patient_name': item.patient.name,
                    'date': item.created_at.strftime("%Y-%m-%d %H:%M") if item.created_at else "N/A",
                    'amount': float(item.total_amount)
                })

        elif report_type == 'bill':
            queryset = Bill.objects.all().order_by('-id')
            if start_date and end_date:
                queryset = queryset.filter(created_at__date__range=(start_date, end_date))
            if status:
                queryset = queryset.filter(payment_status=status)
            if search:
                queryset = queryset.filter(patient__name__icontains=search)

            for item in queryset:
                data.append({
                    'id': item.id,
                    'patient_name': item.patient.name,
                    'total': float(item.total_amount),
                    'paid': float(item.paid_amount),
                    'balance': float(item.total_amount - item.paid_amount),
                    'status': item.payment_status,
                    'date': item.created_at.strftime("%Y-%m-%d")
                })

        elif report_type == 'payment':
            queryset = Payment.objects.all().order_by('-id')
            if start_date and end_date:
                queryset = queryset.filter(payment_date__date__range=(start_date, end_date))
            if status:
                queryset = queryset.filter(payment_status=status)
            if payment_method:
                queryset = queryset.filter(payment_method=payment_method)
            if search:
                queryset = queryset.filter(Q(patient_name__icontains=search) | Q(transaction_id__icontains=search))

            for item in queryset:
                data.append({
                    'id': item.id,
                    'patient_name': item.patient_name,
                    'amount': float(item.amount),
                    'method': item.payment_method,
                    'date': item.payment_date.strftime("%Y-%m-%d") if item.payment_date else "N/A",
                    'status': item.payment_status,
                    'transaction_id': item.transaction_id
                })

        elif report_type == 'inventory':
            queryset = Medicine.objects.all().order_by('name')
            if inventory_stock == 'low':
                queryset = queryset.filter(quantity_in_stock__lt=10, quantity_in_stock__gt=0)
            elif inventory_stock == 'out':
                queryset = queryset.filter(quantity_in_stock=0)
            if search:
                queryset = queryset.filter(name__icontains=search)

            for item in queryset:
                data.append({
                    'id': item.id,
                    'name': item.name,
                    'category': item.category,
                    'price': float(item.price),
                    'stock': item.quantity_in_stock,
                    'expiry': item.expiry_date.strftime("%Y-%m-%d") if item.expiry_date else "N/A"
                })

        elif report_type == 'prescription':
            queryset = Prescription.objects.all().order_by('-prescription_date', '-id')
            if start_date and end_date:
                queryset = queryset.filter(prescription_date__range=(start_date, end_date))
            if doctor_id:
                queryset = queryset.filter(doctor_id=doctor_id)
            if search:
                queryset = queryset.filter(Q(patient__name__icontains=search) | Q(doctor__name__icontains=search))

            for item in queryset:
                data.append({
                    'id': item.id,
                    'patient_name': item.patient.name,
                    'doctor_name': f"Dr. {item.doctor.name}",
                    'date': item.prescription_date.strftime("%Y-%m-%d") if item.prescription_date else "N/A",
                    'diagnosis': item.diagnosis,
                    'medicines_count': item.medicines.count()
                })

        return Response(data)





