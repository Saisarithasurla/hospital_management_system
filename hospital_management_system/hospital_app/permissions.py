from rest_framework import permissions

class RoleBasedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Get user's role from profile
        try:
            role = request.user.profile.role
        except Exception:
            role = 'Admin' if request.user.is_superuser else 'Receptionist'

        if role == 'Admin':
            return True

        # Check view name or path
        view_name = view.__class__.__name__

        # Doctor permissions
        if role == 'Doctor':
            # View Patients, View Appointments, Update Appointment Status.
            # Cannot manage Doctors, cannot manage Bills.
            if view_name == 'PatientViewSet':
                # Only GET requests (list, retrieve)
                return request.method in permissions.SAFE_METHODS
            elif view_name == 'AppointmentViewSet':
                # GET requests and PUT/PATCH (for updating status)
                return request.method in permissions.SAFE_METHODS or request.method in ['PUT', 'PATCH']
            elif view_name == 'DoctorViewSet':
                # Doctor has no access to manage doctors, but can view doctors (GET) to render lists in Appointments
                return request.method in permissions.SAFE_METHODS
            elif view_name in ['BillViewSet', 'PaymentViewSet', 'RoomViewSet', 'BedViewSet', 'PatientBedAllocationViewSet', 'TransferHistoryViewSet', 'ReportViewSet']:
                # Doctor cannot manage or view bills, payments, room allocation records, or system reports
                return False
            return True

        # Receptionist permissions
        if role == 'Receptionist':
            # Manage Patients, Manage Appointments, Manage Bills.
            # Cannot Manage Doctors.
            if view_name == 'DoctorViewSet':
                # Receptionist can view doctors to assign them to appointments, but cannot modify
                return request.method in permissions.SAFE_METHODS
            return True

        return False
