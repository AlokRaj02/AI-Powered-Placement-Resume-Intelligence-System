import express from 'express';

const router = express.Router();

// Helper to normalize skill strings
const normalize = (str) => (str ? str.trim().toLowerCase() : '');

// Seed placement drives data
const DRIVES = [
  {
    id: 1,
    company_name: 'Google',
    role_title: 'Software Development Engineer (SDE-1)',
    description: 'Core software engineering position focusing on scalable systems, algorithms, distributed computing, and Java/C++.',
    eligibility_departments: ['Computer Science', 'Information Technology'],
    min_cgpa: 7.5,
    package_lpa: 28.0,
    mandatory_skills: ['Java', 'SQL', 'Problem Solving'],
    preferred_skills: ['Spring Boot', 'Distributed Systems', 'Docker'],
    is_active: true,
    drive_date: '2026-11-15'
  },
  {
    id: 2,
    company_name: 'Amazon',
    role_title: 'Full Stack Web Developer',
    description: 'Full stack development role requiring expertise in React, Node.js, RESTful architectures, and SQL/NoSQL databases.',
    eligibility_departments: ['Computer Science', 'Information Technology', 'Electronics'],
    min_cgpa: 7.0,
    package_lpa: 24.0,
    mandatory_skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    preferred_skills: ['MongoDB', 'AWS', 'TypeScript'],
    is_active: true,
    drive_date: '2026-11-20'
  },
  {
    id: 3,
    company_name: 'Microsoft',
    role_title: 'Data & AI Engineer',
    description: 'Role focusing on SQL database architectures, Python data pipelines, cloud services, and machine learning models.',
    eligibility_departments: ['Computer Science', 'Data Science', 'Information Technology'],
    min_cgpa: 8.0,
    package_lpa: 26.5,
    mandatory_skills: ['Python', 'SQL', 'Machine Learning'],
    preferred_skills: ['PyTorch', 'PowerBI', 'PostgreSQL'],
    is_active: true,
    drive_date: '2026-11-28'
  },
  {
    id: 4,
    company_name: 'Atlassian',
    role_title: 'Cloud Platform Engineer',
    description: 'DevOps and cloud infrastructure engineering position focusing on containerization, CI/CD pipelines, and high reliability.',
    eligibility_departments: ['Computer Science', 'Information Technology'],
    min_cgpa: 7.5,
    package_lpa: 22.0,
    mandatory_skills: ['Linux', 'Git', 'Docker', 'Python'],
    preferred_skills: ['Kubernetes', 'CI/CD', 'AWS'],
    is_active: true,
    drive_date: '2026-12-05'
  },
  {
    id: 5,
    company_name: 'TCS Digital',
    role_title: 'Digital Systems Specialist',
    description: 'Specialist programming role working on enterprise transformation, API engineering, and full-stack solutions.',
    eligibility_departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'],
    min_cgpa: 6.8,
    package_lpa: 9.0,
    mandatory_skills: ['Java', 'SQL', 'Problem Solving'],
    preferred_skills: ['Spring', 'HTML/CSS', 'Git'],
    is_active: true,
    drive_date: '2026-12-12'
  }
];

// Seed student profiles
const STUDENTS = {
  demo_student_101: {
    student_id: 'demo_student_101',
    student_name: 'Alok Raj',
    email: 'alok@example.com',
    department: 'Computer Science',
    cgpa: 8.5,
    skills: {
      Java: 85,
      SQL: 80,
      'Problem Solving': 90,
      React: 75,
      'Node.js': 70,
      JavaScript: 85,
      MongoDB: 80,
      Git: 75
    },
    projects: [
      { title: 'AI Resume Analyzer', skills: ['Node.js', 'React', 'MongoDB'], score: 92 },
      { title: 'Campus Placement Portal', skills: ['React', 'Node.js', 'SQL'], score: 88 }
    ],
    assessments: [{ name: 'DSA Benchmark', score: 88 }]
  },
  demo_student_102: {
    student_id: 'demo_student_102',
    student_name: 'Priya Sharma',
    email: 'priya@example.com',
    department: 'Information Technology',
    cgpa: 8.8,
    skills: {
      Python: 90,
      'Machine Learning': 85,
      SQL: 80,
      PyTorch: 75,
      PowerBI: 70
    },
    projects: [{ title: 'Predictive Analytics Dashboard', skills: ['Python', 'SQL'], score: 90 }],
    assessments: [{ name: 'Data Engineering Test', score: 85 }]
  },
  demo_student_103: {
    student_id: 'demo_student_103',
    student_name: 'Rahul Verma',
    email: 'rahul@example.com',
    department: 'Electronics',
    cgpa: 7.2,
    skills: {
      Linux: 80,
      Git: 75,
      Docker: 70,
      Python: 65,
      C: 75
    },
    projects: [{ title: 'Embedded IoT Hub', skills: ['C', 'Linux'], score: 82 }],
    assessments: [{ name: 'Core Computing Fundamentals', score: 76 }]
  }
};

// Helper: Get or construct student profile
function getStudentProfile(studentId, nameQuery) {
  if (STUDENTS[studentId]) {
    return STUDENTS[studentId];
  }
  return {
    student_id: studentId,
    student_name: nameQuery || 'Student Candidate',
    email: `${studentId}@university.edu`,
    department: 'Computer Science',
    cgpa: 8.0,
    skills: {
      Java: 80,
      SQL: 75,
      'Problem Solving': 85,
      JavaScript: 75,
      React: 70,
      'Node.js': 70
    },
    projects: [{ title: 'Web Application Portfolio', skills: ['JavaScript', 'React'], score: 85 }],
    assessments: [{ name: 'Placement Readiness Test', score: 80 }]
  };
}

// Helper: Evaluate Eligibility
function evaluateStudentEligibility(profile, drive) {
  const gapReasons = [];

  // 1. CGPA Check
  if (profile.cgpa < drive.min_cgpa) {
    gapReasons.push(`CGPA (${profile.cgpa.toFixed(2)}) is below minimum required CGPA (${drive.min_cgpa.toFixed(2)})`);
  }

  // 2. Department Check
  if (drive.eligibility_departments && drive.eligibility_departments.length > 0) {
    const deptMatch = drive.eligibility_departments.some(
      (d) => normalize(d) === normalize(profile.department)
    );
    if (!deptMatch) {
      gapReasons.push(`Department '${profile.department}' is not in eligible list: ${drive.eligibility_departments.join(', ')}`);
    }
  }

  // 3. Mandatory Skills Check
  const studentSkillsNorm = Object.keys(profile.skills || {}).map((s) => normalize(s));
  const missingMandatory = [];
  (drive.mandatory_skills || []).forEach((mand) => {
    if (!studentSkillsNorm.includes(normalize(mand))) {
      missingMandatory.push(mand);
    }
  });

  if (missingMandatory.length > 0) {
    gapReasons.push(`Missing mandatory skill(s): ${missingMandatory.join(', ')}`);
  }

  const isEligible = gapReasons.length === 0;
  return {
    is_eligible: isEligible,
    status: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
    gap_reasons: gapReasons,
    missing_mandatory: missingMandatory
  };
}

// Helper: Calculate Readiness
function calculateStudentReadiness(profile, drive, missingMandatoryList) {
  const studentSkills = profile.skills || {};
  const studentSkillKeysNorm = {};
  Object.entries(studentSkills).forEach(([k, v]) => {
    studentSkillKeysNorm[normalize(k)] = { orig: k, prof: v };
  });

  const mandatory = drive.mandatory_skills || [];
  const preferred = drive.preferred_skills || [];

  const matchedSkills = [];
  const missingMandatory = [];
  const missingPreferred = [];

  let totalProficiency = 0;
  let matchedCount = 0;

  mandatory.forEach((s) => {
    const norm = normalize(s);
    if (studentSkillKeysNorm[norm]) {
      const { orig, prof } = studentSkillKeysNorm[norm];
      matchedSkills.push({ name: orig, type: 'mandatory', proficiency: prof });
      totalProficiency += prof;
      matchedCount++;
    } else {
      missingMandatory.push(s);
    }
  });

  preferred.forEach((s) => {
    const norm = normalize(s);
    if (studentSkillKeysNorm[norm]) {
      const { orig, prof } = studentSkillKeysNorm[norm];
      matchedSkills.push({ name: orig, type: 'preferred', proficiency: prof });
      totalProficiency += prof;
      matchedCount++;
    } else {
      missingPreferred.push(s);
    }
  });

  const mandatoryMatchPct = mandatory.length > 0
    ? ((mandatory.length - missingMandatory.length) / mandatory.length) * 100
    : 100.0;
  const preferredMatchPct = preferred.length > 0
    ? ((preferred.length - missingPreferred.length) / preferred.length) * 100
    : 100.0;

  const avgProficiency = matchedCount > 0 ? totalProficiency / matchedCount : 50.0;

  // Weighted: 50% mandatory, 25% preferred, 25% proficiency
  let readinessScore = (0.50 * mandatoryMatchPct) + (0.25 * preferredMatchPct) + (0.25 * avgProficiency);
  readinessScore = Math.round(Math.min(100.0, Math.max(0.0, readinessScore)) * 10) / 10;

  return {
    readiness_score: readinessScore,
    skill_match_percentage: Math.round(((mandatoryMatchPct + preferredMatchPct) / 2) * 10) / 10,
    evidence_score: Math.round(avgProficiency * 10) / 10,
    matched_skills: matchedSkills,
    missing_mandatory_skills: missingMandatory,
    missing_preferred_skills: missingPreferred
  };
}

// Helper: Generate Preparation Plan
function generatePreparationPlan(profile, drive, missingMandatory, missingPreferred) {
  const steps = [];
  const projects = [];
  const resources = [];

  if (missingMandatory && missingMandatory.length > 0) {
    missingMandatory.forEach((skill, idx) => {
      steps.push({
        step: idx + 1,
        title: `Master Core Skill: ${skill}`,
        priority: 'HIGH (Mandatory)',
        description: `Focus on fundamental concepts, hands-on practice, and problem solving in ${skill}.`,
        target_days: 7
      });
      projects.push({
        skill: skill,
        title: `Build a ${skill}-Based Application`,
        description: `Implement a production-grade mini project demonstrating ${skill} integration, database efficiency, and clean code.`
      });
      resources.push({
        skill: skill,
        type: 'Documentation & Practice',
        title: `${skill} Official Guide & LeetCode Exercises`,
        url: `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}+tutorial`
      });
    });
  }

  if (missingPreferred && missingPreferred.length > 0) {
    missingPreferred.forEach((skill, idx) => {
      steps.push({
        step: steps.length + 1,
        title: `Explore Preferred Skill: ${skill}`,
        priority: 'MEDIUM (Preferred)',
        description: `Familiarize yourself with ${skill} framework features to boost candidate ranking.`,
        target_days: 4
      });
      resources.push({
        skill: skill,
        type: 'Tutorial',
        title: `${skill} Crash Course & Best Practices`,
        url: `https://www.google.com/search?q=${encodeURIComponent(skill)}+crash+course`
      });
    });
  }

  if ((!missingMandatory || missingMandatory.length === 0) && (!missingPreferred || missingPreferred.length === 0)) {
    steps.push({
      step: 1,
      title: 'Mock Interview & System Architecture Practice',
      priority: 'OPTIMIZATION',
      description: 'You meet all technical skill requirements! Focus on mock interviews, behavioral prep, and system design questions.',
      target_days: 3
    });
  }

  return {
    recommended_steps: steps,
    recommended_projects: projects,
    learning_resources: resources
  };
}

// ==========================================
// ROUTES
// ==========================================

// 1. GET /api/p06/drives (with optional ?q= query)
router.get(['/drives', '/drives/'], (req, res) => {
  const query = req.query.q ? req.query.q.trim().toLowerCase() : '';
  let filtered = DRIVES.filter((d) => d.is_active);

  if (query) {
    filtered = filtered.filter(
      (d) =>
        d.company_name.toLowerCase().includes(query) ||
        d.role_title.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        d.mandatory_skills.some((s) => s.toLowerCase().includes(query)) ||
        d.preferred_skills.some((s) => s.toLowerCase().includes(query))
    );
  }

  res.json(filtered);
});

// 2. GET /api/p06/overview/:studentId
router.get(['/overview/:studentId', '/overview/:studentId/'], (req, res) => {
  const { studentId } = req.params;
  const profile = getStudentProfile(studentId, req.query.name);

  const evaluations = DRIVES.filter((d) => d.is_active).map((drive) => {
    const eligibility = evaluateStudentEligibility(profile, drive);
    const readiness = calculateStudentReadiness(profile, drive, eligibility.missing_mandatory);
    return {
      drive,
      eligibility,
      readiness
    };
  });

  res.json({
    profile,
    evaluations
  });
});

// 3. GET /api/p06/evaluate/:studentId/:driveId
router.get(['/evaluate/:studentId/:driveId', '/evaluate/:studentId/:driveId/'], (req, res) => {
  const { studentId, driveId } = req.params;
  const drive = DRIVES.find((d) => d.id === parseInt(driveId, 10));

  if (!drive) {
    return res.status(404).json({ error: 'Placement drive not found' });
  }

  const profile = getStudentProfile(studentId, req.query.name);
  const eligibility = evaluateStudentEligibility(profile, drive);
  const readiness = calculateStudentReadiness(profile, drive, eligibility.missing_mandatory);
  const prepPlan = generatePreparationPlan(
    profile,
    drive,
    readiness.missing_mandatory_skills,
    readiness.missing_preferred_skills
  );

  res.json({
    student_id: studentId,
    drive,
    profile,
    eligibility,
    readiness,
    preparation_plan: prepPlan
  });
});

// 4. GET /api/p06/recruiter/students
router.get(['/recruiter/students', '/recruiter/students/'], (req, res) => {
  const recruiterEmail = req.headers['x-recruiter-email'] || 'placement_officer@university.edu';
  const candidates = Object.values(STUDENTS).map((student) => {
    const readinessRecords = DRIVES.filter((d) => d.is_active).map((drive) => {
      const eligibility = evaluateStudentEligibility(student, drive);
      return calculateStudentReadiness(student, drive, eligibility.missing_mandatory);
    });

    return {
      student,
      readiness_records: readinessRecords
    };
  });

  res.json({
    recruiter_logged: recruiterEmail,
    candidates
  });
});

export default router;
