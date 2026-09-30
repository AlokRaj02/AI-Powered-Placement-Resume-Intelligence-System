import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Avg, Count
from .models import (
    StudentSkillProfile,
    PlacementDrive,
    EligibilityResult,
    ReadinessAnalysis,
    PreparationPlan,
    RecruiterAccessLog
)
from .serializers import (
    StudentSkillProfileSerializer,
    PlacementDriveSerializer,
    EligibilityResultSerializer,
    ReadinessAnalysisSerializer,
    PreparationPlanSerializer,
    RecruiterAccessLogSerializer
)

# Helper function to normalize skill names (lowercase comparison)
def normalize_skill(skill_str):
    return skill_str.strip().lower()

# Core Eligibility Evaluation Logic
def evaluate_student_eligibility(profile, drive):
    gap_reasons = []
    
    # 1. CGPA Check
    if profile.cgpa < drive.min_cgpa:
        gap_reasons.append(f"CGPA ({profile.cgpa:.2f}) is below minimum required CGPA ({drive.min_cgpa:.2f})")
        
    # 2. Department Check
    if drive.eligibility_departments and len(drive.eligibility_departments) > 0:
        dept_match = any(normalize_skill(d) == normalize_skill(profile.department) for d in drive.eligibility_departments)
        if not dept_match:
            gap_reasons.append(f"Department '{profile.department}' is not in eligible list: {', '.join(drive.eligibility_departments)}")
            
    # 3. Mandatory Skill Check
    student_skills_lower = {normalize_skill(k): v for k, v in profile.skills.items()}
    missing_mandatory = []
    for mandatory in drive.mandatory_skills:
        if normalize_skill(mandatory) not in student_skills_lower:
            missing_mandatory.append(mandatory)
            
    if missing_mandatory:
        gap_reasons.append(f"Missing mandatory skill(s): {', '.join(missing_mandatory)}")
        
    is_eligible = len(gap_reasons) == 0
    status_str = "ELIGIBLE" if is_eligible else "INELIGIBLE"
    
    eligibility_obj, _ = EligibilityResult.objects.update_or_create(
        student_id=profile.student_id,
        drive=drive,
        defaults={
            'is_eligible': is_eligible,
            'status': status_str,
            'gap_reasons': gap_reasons
        }
    )
    return eligibility_obj, gap_reasons, missing_mandatory

# Core Readiness Calculation Logic
def calculate_student_readiness(profile, drive, missing_mandatory_list=None):
    student_skills = profile.skills or {}
    student_skills_lower = {normalize_skill(k): (k, v) for k, v in student_skills.items()}
    
    mandatory = drive.mandatory_skills or []
    preferred = drive.preferred_skills or []
    
    matched_skills = []
    missing_mandatory = []
    missing_preferred = []
    
    total_proficiency = 0
    matched_count = 0
    
    # Evaluate Mandatory Skills
    for s in mandatory:
        norm = normalize_skill(s)
        if norm in student_skills_lower:
            orig_name, prof = student_skills_lower[norm]
            matched_skills.append({"name": orig_name, "type": "mandatory", "proficiency": prof})
            total_proficiency += prof
            matched_count += 1
        else:
            missing_mandatory.append(s)
            
    # Evaluate Preferred Skills
    for s in preferred:
        norm = normalize_skill(s)
        if norm in student_skills_lower:
            orig_name, prof = student_skills_lower[norm]
            matched_skills.append({"name": orig_name, "type": "preferred", "proficiency": prof})
            total_proficiency += prof
            matched_count += 1
        else:
            missing_preferred.append(s)
            
    mandatory_match_pct = ((len(mandatory) - len(missing_mandatory)) / len(mandatory) * 100) if mandatory else 100.0
    preferred_match_pct = ((len(preferred) - len(missing_preferred)) / len(preferred) * 100) if preferred else 100.0
    
    # Evidence & Proficiency Score (0 to 100)
    avg_proficiency = (total_proficiency / matched_count) if matched_count > 0 else 50.0
    
    # Weighted readiness score: 50% mandatory, 25% preferred, 25% proficiency/evidence
    readiness_score = (0.50 * mandatory_match_pct) + (0.25 * preferred_match_pct) + (0.25 * avg_proficiency)
    readiness_score = round(min(100.0, max(0.0, readiness_score)), 1)
    
    readiness_obj, _ = ReadinessAnalysis.objects.update_or_create(
        student_id=profile.student_id,
        drive=drive,
        defaults={
            'readiness_score': readiness_score,
            'skill_match_percentage': round((mandatory_match_pct + preferred_match_pct) / 2, 1),
            'evidence_score': round(avg_proficiency, 1),
            'matched_skills': matched_skills,
            'missing_mandatory_skills': missing_mandatory,
            'missing_preferred_skills': missing_preferred
        }
    )
    return readiness_obj

# Core Preparation Plan Generator Logic
def generate_preparation_plan(profile, drive, missing_mandatory, missing_preferred):
    steps = []
    projects = []
    resources = []
    
    if missing_mandatory:
        for index, skill in enumerate(missing_mandatory, 1):
            steps.append({
                "step": index,
                "title": f"Master Core Skill: {skill}",
                "priority": "HIGH (Mandatory)",
                "description": f"Focus on fundamental concepts, hands-on practice, and problem solving in {skill}.",
                "target_days": 7
            })
            projects.append({
                "skill": skill,
                "title": f"Build a {skill} Based Application",
                "description": f"Implement a mini project demonstrating {skill} integration, database query optimization, or algorithmic problem solving."
            })
            resources.append({
                "skill": skill,
                "type": "Documentation & Practice",
                "title": f"{skill} Official Guide & LeetCode / HackerRank Exercises",
                "url": f"https://www.google.com/search?q=learn+{skill}+tutorial"
            })
            
    if missing_preferred:
        for index, skill in enumerate(missing_preferred, len(steps) + 1):
            steps.append({
                "step": index,
                "title": f"Explore Preferred Skill: {skill}",
                "priority": "MEDIUM (Preferred)",
                "description": f"Familiarize yourself with {skill} framework features to boost candidate ranking.",
                "target_days": 4
            })
            resources.append({
                "skill": skill,
                "type": "Tutorial",
                "title": f"{skill} Crash Course & Best Practices",
                "url": f"https://www.google.com/search?q={skill}+crash+course"
            })
            
    if not missing_mandatory and not missing_preferred:
        steps.append({
            "step": 1,
            "title": "Mock Interview & System Design Practice",
            "priority": "OPTIMIZATION",
            "description": "You meet all technical skill requirements! Focus on mock interviews, behavioral prep, and system design.",
            "target_days": 3
        })
        
    prep_obj, _ = PreparationPlan.objects.update_or_create(
        student_id=profile.student_id,
        drive=drive,
        defaults={
            'recommended_steps': steps,
            'recommended_projects': projects,
            'learning_resources': resources
        }
    )
    return prep_obj

# --- API VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def profile_detail(request, student_id):
    if request.method == 'GET':
        profile, created = StudentSkillProfile.objects.get_or_create(
            student_id=student_id,
            defaults={
                'student_name': request.query_params.get('name', 'Student'),
                'department': 'Computer Science',
                'cgpa': 7.8,
                'skills': {"Java": 80, "Problem Solving": 75},
                'projects': [{"title": "Web App", "skills": ["Java"], "score": 85}],
                'assessments': [{"name": "Coding Test", "score": 80}]
            }
        )
        serializer = StudentSkillProfileSerializer(profile)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        data = request.data.copy()
        data['student_id'] = student_id
        profile = StudentSkillProfile.objects.filter(student_id=student_id).first()
        if profile:
            serializer = StudentSkillProfileSerializer(profile, data=data, partial=True)
        else:
            serializer = StudentSkillProfileSerializer(data=data)
            
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK if profile else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def placement_drives(request):
    if request.method == 'GET':
        query = request.query_params.get('q', '').strip()
        drives = PlacementDrive.objects.filter(is_active=True)
        if query:
            drives = drives.filter(
                Q(company_name__icontains=query) |
                Q(role_title__icontains=query) |
                Q(description__icontains=query)
            )
        serializer = PlacementDriveSerializer(drives, many=True)
        return Response(serializer.data)
        
    elif request.method == 'POST':
        serializer = PlacementDriveSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def evaluate_drive_readiness(request, student_id, drive_id):
    try:
        drive = PlacementDrive.objects.get(id=drive_id)
    except PlacementDrive.DoesNotExist:
        return Response({"error": "Placement drive not found"}, status=status.HTTP_404_NOT_FOUND)
        
    profile, _ = StudentSkillProfile.objects.get_or_create(
        student_id=student_id,
        defaults={
            'student_name': request.query_params.get('name', 'Student'),
            'department': 'Computer Science',
            'cgpa': 8.0,
            'skills': {"Java": 85, "SQL": 70, "Problem Solving": 90}
        }
    )
    
    eligibility_obj, gap_reasons, missing_mandatory = evaluate_student_eligibility(profile, drive)
    readiness_obj = calculate_student_readiness(profile, drive, missing_mandatory)
    prep_obj = generate_preparation_plan(profile, drive, readiness_obj.missing_mandatory_skills, readiness_obj.missing_preferred_skills)
    
    return Response({
        "student_id": student_id,
        "drive": PlacementDriveSerializer(drive).data,
        "profile": StudentSkillProfileSerializer(profile).data,
        "eligibility": EligibilityResultSerializer(eligibility_obj).data,
        "readiness": ReadinessAnalysisSerializer(readiness_obj).data,
        "preparation_plan": PreparationPlanSerializer(prep_obj).data
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def student_overview(request, student_id):
    profile, _ = StudentSkillProfile.objects.get_or_create(
        student_id=student_id,
        defaults={
            'student_name': 'Student',
            'department': 'Computer Science',
            'cgpa': 8.0,
            'skills': {"Java": 85, "SQL": 80, "Problem Solving": 90}
        }
    )
    
    drives = PlacementDrive.objects.filter(is_active=True)
    evaluations = []
    
    for drive in drives:
        eligibility_obj, gap_reasons, missing_mandatory = evaluate_student_eligibility(profile, drive)
        readiness_obj = calculate_student_readiness(profile, drive, missing_mandatory)
        evaluations.append({
            "drive": PlacementDriveSerializer(drive).data,
            "eligibility": EligibilityResultSerializer(eligibility_obj).data,
            "readiness": ReadinessAnalysisSerializer(readiness_obj).data
        })
        
    return Response({
        "profile": StudentSkillProfileSerializer(profile).data,
        "evaluations": evaluations
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def recruiter_student_list(request):
    recruiter_id = request.headers.get('X-Recruiter-ID', request.query_params.get('recruiter_id', 'recruiter_demo'))
    recruiter_email = request.headers.get('X-Recruiter-Email', request.query_params.get('recruiter_email', 'recruiter@company.com'))
    
    drive_id = request.query_params.get('drive_id')
    drive = None
    if drive_id:
        try:
            drive = PlacementDrive.objects.get(id=drive_id)
        except PlacementDrive.DoesNotExist:
            pass
            
    # Audit log entry
    RecruiterAccessLog.objects.create(
        recruiter_id=recruiter_id,
        recruiter_email=recruiter_email,
        student_id="BATCH_QUERY",
        action=f"VIEW_READINESS_BATCH_DRIVE_{drive_id if drive_id else 'ALL'}",
        drive=drive
    )
    
    profiles = StudentSkillProfile.objects.all()
    results = []
    for p in profiles:
        readiness = ReadinessAnalysis.objects.filter(student_id=p.student_id)
        if drive:
            readiness = readiness.filter(drive=drive)
        results.append({
            "student": StudentSkillProfileSerializer(p).data,
            "readiness_records": ReadinessAnalysisSerializer(readiness, many=True).data
        })
        
    return Response({
        "recruiter_logged": recruiter_email,
        "candidates": results
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def drive_analytics(request, drive_id):
    try:
        drive = PlacementDrive.objects.get(id=drive_id)
    except PlacementDrive.DoesNotExist:
        return Response({"error": "Drive not found"}, status=status.HTTP_404_NOT_FOUND)
        
    total_evals = EligibilityResult.objects.filter(drive=drive).count()
    eligible_count = EligibilityResult.objects.filter(drive=drive, is_eligible=True).count()
    ineligible_count = total_evals - eligible_count
    
    avg_readiness = ReadinessAnalysis.objects.filter(drive=drive).aggregate(Avg('readiness_score'))['readiness_score__avg'] or 0.0
    
    return Response({
        "drive": PlacementDriveSerializer(drive).data,
        "metrics": {
            "total_candidates": total_evals,
            "eligible_candidates": eligible_count,
            "ineligible_candidates": ineligible_count,
            "eligibility_rate_pct": round((eligible_count / total_evals * 100), 1) if total_evals > 0 else 0.0,
            "average_readiness_score": round(avg_readiness, 1)
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def seed_demo_data(request):
    # Seed Demo Drives
    drive1, _ = PlacementDrive.objects.get_or_create(
        company_name="Google",
        role_title="Software Development Engineer (SDE-1)",
        defaults={
            "description": "Core software engineering position focusing on scalable systems, algorithms, and Java/C++.",
            "eligibility_departments": ["Computer Science", "Information Technology"],
            "min_cgpa": 7.5,
            "mandatory_skills": ["Java", "SQL", "Problem Solving"],
            "preferred_skills": ["Spring Boot", "Distributed Systems", "Docker"],
            "is_active": True
        }
    )
    drive2, _ = PlacementDrive.objects.get_or_create(
        company_name="Amazon",
        role_title="Full Stack Web Developer",
        defaults={
            "description": "Full stack development role requiring expertise in React, Node.js, and SQL databases.",
            "eligibility_departments": ["Computer Science", "Information Technology", "Electronics"],
            "min_cgpa": 7.0,
            "mandatory_skills": ["JavaScript", "React", "Node.js", "SQL"],
            "preferred_skills": ["MongoDB", "AWS", "TypeScript"],
            "is_active": True
        }
    )
    drive3, _ = PlacementDrive.objects.get_or_create(
        company_name="Microsoft",
        role_title="Data & AI Engineer",
        defaults={
            "description": "Role focusing on SQL database architectures, Python data pipelines, and machine learning models.",
            "eligibility_departments": ["Computer Science", "Data Science", "Information Technology"],
            "min_cgpa": 8.0,
            "mandatory_skills": ["Python", "SQL", "Machine Learning"],
            "preferred_skills": ["PyTorch", "PowerBI", "PostgreSQL"],
            "is_active": True
        }
    )
    
    # Seed Demo Student Profiles
    StudentSkillProfile.objects.get_or_create(
        student_id="demo_student_101",
        defaults={
            "student_name": "Alok Raj",
            "email": "alok@example.com",
            "department": "Computer Science",
            "cgpa": 8.5,
            "skills": {"Java": 85, "SQL": 80, "Problem Solving": 90, "React": 75, "Node.js": 70},
            "projects": [{"title": "AI Resume Analyzer", "skills": ["Node.js", "React", "MongoDB"], "score": 92}],
            "assessments": [{"name": "DSA Benchmark", "score": 88}]
        }
    )
    
    return Response({
        "message": "Demo placement drives and student profile seeded successfully!",
        "drives_created": [drive1.company_name, drive2.company_name, drive3.company_name]
    })
