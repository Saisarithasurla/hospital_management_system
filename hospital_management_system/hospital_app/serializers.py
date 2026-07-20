from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Doctor, Patient, Appointment, Bill, Notification, MedicalHistory, Medicine, Payment, Room, Bed, PatientBedAllocation, TransferHistory, Prescription, PrescriptionMedicine

class DoctorSerializer(serializers.ModelSerializer):
    def validate_phone(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")

        if len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value
    class Meta:
        model = Doctor
        fields = "__all__"

class PatientSerializer(serializers.ModelSerializer):
    def validate_phone(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        if len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value
    class Meta:
        model = Patient
        fields = "__all__"

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = "__all__"
class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = "__all__"

class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["username", "email", "role"]

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Exception:
            if obj.is_superuser:
                return "Admin"
            return "Receptionist"

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        try:
            token['role'] = user.profile.role
        except Exception:
            token['role'] = 'Admin' if user.is_superuser else 'Receptionist'
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        try:
            data['role'] = self.user.profile.role
        except Exception:
            data['role'] = 'Admin' if self.user.is_superuser else 'Receptionist'
        data['username'] = self.user.username
        return data

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(data["new_password"], self.context["request"].user)
        return data

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"

class MedicalHistorySerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.name')

    class Meta:
        model = MedicalHistory
        fields = "__all__"

class MedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = "__all__"

class PaymentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(required=False)

    class Meta:
        model = Payment
        fields = "__all__"

    def validate(self, attrs):
        bill = attrs.get('bill')
        if bill and not attrs.get('patient_name'):
            attrs['patient_name'] = bill.patient.name
        return attrs


class RoomSerializer(serializers.ModelSerializer):
    beds_count = serializers.IntegerField(source='beds.count', read_only=True)
    occupied_beds_count = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = "__all__"

    def get_occupied_beds_count(self, obj):
        return obj.beds.filter(status='Occupied').count()


class BedSerializer(serializers.ModelSerializer):
    room_number = serializers.ReadOnlyField(source='room.room_number')
    room_type = serializers.ReadOnlyField(source='room.room_type')

    class Meta:
        model = Bed
        fields = "__all__"


class PatientBedAllocationSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.name')
    bed_number = serializers.ReadOnlyField(source='bed.bed_number')
    room_number = serializers.ReadOnlyField(source='bed.room.room_number')

    class Meta:
        model = PatientBedAllocation
        fields = "__all__"


class TransferHistorySerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.name')
    from_bed_number = serializers.ReadOnlyField(source='from_bed.bed_number')
    to_bed_number = serializers.ReadOnlyField(source='to_bed.bed_number')

    class Meta:
        model = TransferHistory
        fields = "__all__"


class PrescriptionMedicineSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='medicine.name')

    class Meta:
        model = PrescriptionMedicine
        fields = "__all__"
        extra_kwargs = {
            'prescription': {'required': False}
        }


class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.name')
    doctor_name = serializers.ReadOnlyField(source='doctor.name')
    appointment_label = serializers.SerializerMethodField()
    medicines = PrescriptionMedicineSerializer(many=True)

    class Meta:
        model = Prescription
        fields = "__all__"

    def get_appointment_label(self, obj):
        try:
            return f"{obj.appointment.appointment_date} @ {obj.appointment.appointment_time}"
        except Exception:
            return "N/A"

    def create(self, validated_data):
        medicines_data = validated_data.pop('medicines')
        prescription = Prescription.objects.create(**validated_data)
        for med_data in medicines_data:
            PrescriptionMedicine.objects.create(prescription=prescription, **med_data)
        return prescription

    def update(self, instance, validated_data):
        medicines_data = validated_data.pop('medicines', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if medicines_data is not None:
            instance.medicines.all().delete()
            for med_data in medicines_data:
                PrescriptionMedicine.objects.create(prescription=instance, **med_data)
        
        return instance





