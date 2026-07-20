from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

class Profile(models.Model):
    ROLE_CHOICES = (
        ('Admin', 'Admin'),
        ('Doctor', 'Doctor'),
        ('Receptionist', 'Receptionist'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Receptionist')

    def __str__(self):
        return f"{self.user.username} - {self.role}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        role = 'Admin' if instance.is_superuser else 'Receptionist'
        Profile.objects.get_or_create(user=instance, defaults={'role': role})

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if not hasattr(instance, 'profile'):
        role = 'Admin' if instance.is_superuser else 'Receptionist'
        Profile.objects.get_or_create(user=instance, defaults={'role': role})
    else:
        instance.profile.save()

class Doctor(models.Model):
    AVAILABILITY_CHOICES = (
        ('Available', 'Available'),
        ('Busy', 'Busy'),
        ('On Leave', 'On Leave'),
    )
    name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='Available')
    def __str__(self):
        return self.name
class Patient(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    def __str__(self):
        return self.name
class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    status = models.CharField(max_length=20, default='Pending')
    def __str__(self):
        return f"{self.patient.name} - {self.doctor.name}"
class Bill(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_status = models.CharField(
        max_length=20,
        default='Pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Bill {self.id} - {self.patient.name}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    description = models.TextField()
    notification_type = models.CharField(max_length=50) # doctor, patient, appointment, bill, auth
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.title} - Read: {self.is_read}"

def notify_all(title, description, notification_type):
    for user in User.objects.all():
        Notification.objects.create(
            user=user,
            title=title,
            description=description,
            notification_type=notification_type
        )

@receiver(post_save, sender=Doctor)
def doctor_post_save(sender, instance, created, **kwargs):
    title = "Doctor Added" if created else "Doctor Updated"
    description = f"Doctor {instance.name} ({instance.specialization}) was added." if created else f"Doctor {instance.name} ({instance.specialization}) was updated."
    notify_all(title, description, "doctor")

@receiver(post_delete, sender=Doctor)
def doctor_post_delete(sender, instance, **kwargs):
    notify_all("Doctor Deleted", f"Doctor {instance.name} was deleted.", "doctor")

@receiver(post_save, sender=Patient)
def patient_post_save(sender, instance, created, **kwargs):
    title = "Patient Registered" if created else "Patient Updated"
    description = f"Patient {instance.name} (Age: {instance.age}) was registered." if created else f"Patient {instance.name} was updated."
    notify_all(title, description, "patient")

@receiver(post_delete, sender=Patient)
def patient_post_delete(sender, instance, **kwargs):
    notify_all("Patient Deleted", f"Patient {instance.name} was deleted.", "patient")

@receiver(post_save, sender=Appointment)
def appointment_post_save(sender, instance, created, **kwargs):
    if created:
        title = "Appointment Created"
        description = f"Appointment scheduled for {instance.patient.name} with Dr. {instance.doctor.name} on {instance.appointment_date} at {instance.appointment_time}."
    else:
        if instance.status == "Cancelled":
            title = "Appointment Cancelled"
            description = f"Appointment for {instance.patient.name} with Dr. {instance.doctor.name} was cancelled."
        else:
            title = "Appointment Updated"
            description = f"Appointment for {instance.patient.name} with Dr. {instance.doctor.name} was updated."
    notify_all(title, description, "appointment")

@receiver(post_delete, sender=Appointment)
def appointment_post_delete(sender, instance, **kwargs):
    try:
        patient_name = instance.patient.name
        doctor_name = instance.doctor.name
    except Exception:
        patient_name = "Unknown Patient"
        doctor_name = "Unknown Doctor"
    notify_all("Appointment Deleted", f"Appointment for {patient_name} with Dr. {doctor_name} was deleted.", "appointment")

@receiver(post_save, sender=Bill)
def bill_post_save(sender, instance, created, **kwargs):
    if created:
        title = "Bill Generated"
        description = f"Bill of ${instance.amount} generated for {instance.patient.name}."
    else:
        title = "Bill Updated"
        description = f"Bill {instance.id} for {instance.patient.name} was updated to ${instance.amount} (Status: {instance.payment_status})."
    notify_all(title, description, "bill")

@receiver(post_delete, sender=Bill)
def bill_post_delete(sender, instance, **kwargs):
    try:
        patient_name = instance.patient.name
    except Exception:
        patient_name = "Unknown Patient"
    notify_all("Bill Deleted", f"Bill {instance.id} for {patient_name} was deleted.", "bill")


class MedicalHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_histories')
    diagnosis = models.CharField(max_length=255)
    symptoms = models.TextField()
    treatment = models.TextField()
    prescription = models.TextField()
    allergies = models.CharField(max_length=255, default='None', blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    height = models.CharField(max_length=20, blank=True, null=True)
    weight = models.CharField(max_length=20, blank=True, null=True)
    blood_pressure = models.CharField(max_length=20, blank=True, null=True)
    sugar_level = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    visit_date = models.DateField()
    next_followup_date = models.DateField(blank=True, null=True)
    report = models.FileField(upload_to='medical_reports/', blank=True, null=True)

    class Meta:
        unique_together = ('patient', 'visit_date')
        ordering = ['-visit_date']

    def __str__(self):
        return f"{self.patient.name} - {self.diagnosis} ({self.visit_date})"


class Medicine(models.Model):
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    manufacturer = models.CharField(max_length=150)
    batch_number = models.CharField(max_length=50)
    quantity_in_stock = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    supplier_name = models.CharField(max_length=150, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.batch_number})"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('Cash', 'Cash'),
        ('UPI', 'UPI'),
        ('Credit Card', 'Credit Card'),
        ('Debit Card', 'Debit Card'),
        ('Net Banking', 'Net Banking'),
    )
    PAYMENT_STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Failed', 'Failed'),
        ('Refunded', 'Refunded'),
    )

    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='payments')
    patient_name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES)
    payment_date = models.DateTimeField(auto_now_add=True)
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='Pending')
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Payment {self.id} - {self.patient_name} - {self.payment_status}"


@receiver(post_save, sender=Payment)
def payment_post_save(sender, instance, created, **kwargs):
    # Update bill status
    bill = instance.bill
    if instance.payment_status == 'Paid':
        bill.payment_status = 'Paid'
        bill.save()
    elif instance.payment_status == 'Refunded':
        # Check if there are other paid payments for this bill, if not, set back to Pending
        if not Payment.objects.filter(bill=bill, payment_status='Paid').exclude(pk=instance.pk).exists():
            bill.payment_status = 'Pending'
            bill.save()
    elif instance.payment_status == 'Failed':
        if not Payment.objects.filter(bill=bill, payment_status='Paid').exclude(pk=instance.pk).exists():
            bill.payment_status = 'Pending'
            bill.save()

    # Trigger notifications
    title = f"Payment {instance.payment_status}"
    description = f"Payment of ${instance.amount} for bill #{bill.id} ({instance.patient_name}) was {instance.payment_status.lower()} via {instance.payment_method}."
    notify_all(title, description, "bill")


class Room(models.Model):
    ROOM_TYPE_CHOICES = (
        ('General', 'General'),
        ('Semi-Private', 'Semi-Private'),
        ('Private', 'Private'),
        ('ICU', 'ICU'),
    )
    ROOM_STATUS_CHOICES = (
        ('Available', 'Available'),
        ('Occupied', 'Occupied'),
        ('Maintenance', 'Maintenance'),
    )
    room_number = models.CharField(max_length=50, unique=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    floor = models.CharField(max_length=20)
    number_of_beds = models.IntegerField()
    charges_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=ROOM_STATUS_CHOICES, default='Available')

    def __str__(self):
        return f"Room {self.room_number} ({self.room_type})"


class Bed(models.Model):
    BED_STATUS_CHOICES = (
        ('Available', 'Available'),
        ('Occupied', 'Occupied'),
        ('Reserved', 'Reserved'),
    )
    bed_number = models.CharField(max_length=50, unique=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    bed_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=BED_STATUS_CHOICES, default='Available')

    def __str__(self):
        return f"Bed {self.bed_number} in Room {self.room.room_number}"


class PatientBedAllocation(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='allocations')
    bed = models.ForeignKey(Bed, on_delete=models.CASCADE, related_name='allocations')
    allocated_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        status_str = "Active" if self.is_active else f"Released on {self.released_at}"
        return f"{self.patient.name} to {self.bed.bed_number} ({status_str})"


class TransferHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='transfers')
    from_bed = models.ForeignKey(Bed, on_delete=models.CASCADE, related_name='transfers_from')
    to_bed = models.ForeignKey(Bed, on_delete=models.CASCADE, related_name='transfers_to')
    transfer_date = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.patient.name} from {self.from_bed.bed_number} to {self.to_bed.bed_number} on {self.transfer_date}"


class Prescription(models.Model):
    STATUS_CHOICES = (
        ('Prescribed', 'Prescribed'),
        ('Dispensed', 'Dispensed'),
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='prescriptions')
    prescription_date = models.DateField(default=timezone.now)
    diagnosis = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Prescribed')

    def __str__(self):
        return f"Prescription {self.id} for {self.patient.name}"


class PrescriptionMedicine(models.Model):
    INSTRUCTION_CHOICES = (
        ('Before Food', 'Before Food'),
        ('After Food', 'After Food'),
        ('With Food', 'With Food'),
    )
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='medicines')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.IntegerField()
    instructions = models.CharField(max_length=50, choices=INSTRUCTION_CHOICES)

    def __str__(self):
        return f"{self.medicine.name} - {self.dosage} for Prescription {self.prescription.id}"

