from rest_framework import serializers
from .models import (
    StudentSkillProfile,
    PlacementDrive,
    EligibilityResult,
    ReadinessAnalysis,
    PreparationPlan,
    RecruiterAccessLog
)

class StudentSkillProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSkillProfile
        fields = '__all__'

class PlacementDriveSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlacementDrive
        fields = '__all__'

class EligibilityResultSerializer(serializers.ModelSerializer):
    drive_details = PlacementDriveSerializer(source='drive', read_only=True)
    class Meta:
        model = EligibilityResult
        fields = '__all__'

class ReadinessAnalysisSerializer(serializers.ModelSerializer):
    drive_details = PlacementDriveSerializer(source='drive', read_only=True)
    class Meta:
        model = ReadinessAnalysis
        fields = '__all__'

class PreparationPlanSerializer(serializers.ModelSerializer):
    drive_details = PlacementDriveSerializer(source='drive', read_only=True)
    class Meta:
        model = PreparationPlan
        fields = '__all__'

class RecruiterAccessLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruiterAccessLog
        fields = '__all__'
