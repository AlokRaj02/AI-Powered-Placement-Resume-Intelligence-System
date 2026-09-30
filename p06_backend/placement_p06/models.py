from django.db import models

class StudentSkillProfile(models.Model):
    student_id = models.CharField(max_length=100, unique=True, db_index=True)
    student_name = models.CharField(max_length=200, default="Student")
    email = models.EmailField(blank=True, null=True)
    department = models.CharField(max_length=100, default="Computer Science")
    cgpa = models.FloatField(default=0.0)
    skills = models.JSONField(default=dict, help_text="e.g. {'Java': 85, 'SQL': 80}")
    projects = models.JSONField(default=list, help_text="List of project evidence objects")
    assessments = models.JSONField(default=list, help_text="List of assessment score objects")
    certifications = models.JSONField(default=list, help_text="List of certification strings")
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student_name} ({self.student_id})"

class PlacementDrive(models.Model):
    company_name = models.CharField(max_length=200)
    role_title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    eligibility_departments = models.JSONField(default=list, help_text="e.g. ['Computer Science', 'Information Technology']")
    min_cgpa = models.FloatField(default=6.0)
    mandatory_skills = models.JSONField(default=list, help_text="List of mandatory skill strings")
    preferred_skills = models.JSONField(default=list, help_text="List of preferred skill strings")
    drive_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} - {self.role_title}"

class EligibilityResult(models.Model):
    student_id = models.CharField(max_length=100, db_index=True)
    drive = models.ForeignKey(PlacementDrive, on_delete=models.CASCADE, related_name='eligibility_results')
    is_eligible = models.BooleanField(default=False)
    status = models.CharField(max_length=50, default="INELIGIBLE")
    gap_reasons = models.JSONField(default=list)
    checked_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student_id', 'drive')

    def __str__(self):
        return f"{self.student_id} - {self.drive.company_name}: {'ELIGIBLE' if self.is_eligible else 'INELIGIBLE'}"

class ReadinessAnalysis(models.Model):
    student_id = models.CharField(max_length=100, db_index=True)
    drive = models.ForeignKey(PlacementDrive, on_delete=models.CASCADE, related_name='readiness_analyses')
    readiness_score = models.FloatField(default=0.0)
    skill_match_percentage = models.FloatField(default=0.0)
    evidence_score = models.FloatField(default=0.0)
    matched_skills = models.JSONField(default=list)
    missing_mandatory_skills = models.JSONField(default=list)
    missing_preferred_skills = models.JSONField(default=list)
    analyzed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student_id', 'drive')

    def __str__(self):
        return f"{self.student_id} - {self.drive.company_name} Readiness: {self.readiness_score}%"

class PreparationPlan(models.Model):
    student_id = models.CharField(max_length=100, db_index=True)
    drive = models.ForeignKey(PlacementDrive, on_delete=models.CASCADE, related_name='preparation_plans')
    recommended_steps = models.JSONField(default=list)
    recommended_projects = models.JSONField(default=list)
    learning_resources = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student_id', 'drive')

    def __str__(self):
        return f"Prep Plan for {self.student_id} - {self.drive.company_name}"

class RecruiterAccessLog(models.Model):
    recruiter_id = models.CharField(max_length=100)
    recruiter_email = models.CharField(max_length=200)
    student_id = models.CharField(max_length=100, db_index=True)
    action = models.CharField(max_length=100, default="VIEW_READINESS")
    drive = models.ForeignKey(PlacementDrive, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.recruiter_email} viewed {self.student_id} at {self.timestamp}"
