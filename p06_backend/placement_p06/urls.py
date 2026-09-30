from django.urls import path
from . import views

urlpatterns = [
    path('profile/<str:student_id>/', views.profile_detail, name='profile_detail'),
    path('drives/', views.placement_drives, name='placement_drives'),
    path('drives/search/', views.placement_drives, name='placement_drives_search'),
    path('evaluate/<str:student_id>/<int:drive_id>/', views.evaluate_drive_readiness, name='evaluate_drive_readiness'),
    path('overview/<str:student_id>/', views.student_overview, name='student_overview'),
    path('recruiter/students/', views.recruiter_student_list, name='recruiter_student_list'),
    path('analytics/drive/<int:drive_id>/', views.drive_analytics, name='drive_analytics'),
    path('seed/', views.seed_demo_data, name='seed_demo_data'),
]
