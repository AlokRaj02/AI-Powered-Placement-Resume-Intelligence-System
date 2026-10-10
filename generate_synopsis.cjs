const fs = require('fs');
const path = require('path');
const { jsPDF } = require('./frontend/node_modules/jspdf');

function createSynopsisPDF() {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 16;
    const contentWidth = pageWidth - (margin * 2); // 178mm
    let y = margin;

    // Premium Color Palette
    const primaryColor = [26, 43, 76];       // Deep Navy
    const secondaryColor = [37, 99, 235];    // Modern Royal Blue
    const darkTextColor = [30, 41, 59];      // Slate 800
    const mutedTextColor = [100, 116, 139];  // Slate 500
    const cardBgColor = [248, 250, 252];     // Slate 50
    const cardBorderColor = [226, 232, 240]; // Slate 200
    const highlightBg = [239, 246, 255];     // Blue 50
    const highlightBorder = [191, 219, 254]; // Blue 200

    function checkPageBreak(neededHeight) {
        if (y + neededHeight > pageHeight - 18) {
            doc.addPage();
            y = 22; // Leave room for running header
            return true;
        }
        return false;
    }

    function drawSectionHeader(title, minContentHeight = 25) {
        // Prevent orphan headings by checking if header + minimum content fits
        if (y + 12 + minContentHeight > pageHeight - 18) {
            doc.addPage();
            y = 22;
        }

        y += 3;
        // Accent vertical bar
        doc.setFillColor(...secondaryColor);
        doc.rect(margin, y, 3.5, 6.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text(title, margin + 6, y + 5);

        y += 8.5;
        doc.setDrawColor(...cardBorderColor);
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + contentWidth, y);
        y += 3;
    }

    function addParagraph(text, spacing = 3.5) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkTextColor);
        
        const lines = doc.splitTextToSize(text, contentWidth);
        const blockHeight = lines.length * 4.1;
        checkPageBreak(blockHeight);
        
        doc.text(lines, margin, y);
        y += blockHeight + spacing;
    }

    function addBullet(boldLabel, text, spacing = 2.5) {
        doc.setFontSize(9);
        const bulletIndent = 5.5;
        const textWidth = contentWidth - bulletIndent;
        
        doc.setFont('helvetica', 'bold');
        const fullText = (boldLabel ? `${boldLabel}: ` : '') + text;
        const lines = doc.splitTextToSize(fullText, textWidth);
        const blockHeight = lines.length * 4.1;
        
        checkPageBreak(blockHeight + spacing);
        
        // Bullet point dot
        doc.setFillColor(...secondaryColor);
        doc.circle(margin + 2, y - 1, 0.8, 'F');
        
        if (boldLabel) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            const labelStr = boldLabel + ': ';
            const labelWidth = doc.getTextWidth(labelStr);
            doc.text(labelStr, margin + bulletIndent, y);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...darkTextColor);
            
            // First line calculation
            const availableFirstLine = textWidth - labelWidth;
            const words = text.split(' ');
            let firstLine = '';
            let remainingWords = [];
            
            for (let i = 0; i < words.length; i++) {
                const testLine = firstLine ? firstLine + ' ' + words[i] : words[i];
                if (doc.getTextWidth(testLine) <= availableFirstLine) {
                    firstLine = testLine;
                } else {
                    remainingWords = words.slice(i);
                    break;
                }
            }
            
            doc.text(firstLine, margin + bulletIndent + labelWidth, y);
            
            if (remainingWords.length > 0) {
                const restText = remainingWords.join(' ');
                const restLines = doc.splitTextToSize(restText, textWidth);
                y += 4.1;
                doc.text(restLines, margin + bulletIndent, y);
                y += (restLines.length - 1) * 4.1;
            }
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...darkTextColor);
            doc.text(lines, margin + bulletIndent, y);
            y += (lines.length - 1) * 4.1;
        }
        
        y += 4.1 + spacing;
    }

    function addInfoBox(title, text, isHighlight = false, spacing = 3.5) {
        doc.setFontSize(8.8);
        const lines = doc.splitTextToSize(text, contentWidth - 10);
        const boxHeight = (lines.length * 4.0) + (title ? 9 : 5);

        checkPageBreak(boxHeight + spacing);

        doc.setFillColor(...(isHighlight ? highlightBg : cardBgColor));
        doc.setDrawColor(...(isHighlight ? highlightBorder : cardBorderColor));
        doc.setLineWidth(0.35);
        doc.roundedRect(margin, y, contentWidth, boxHeight, 1.8, 1.8, 'FD');

        let innerY = y + 4.5;
        if (title) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(...(isHighlight ? secondaryColor : primaryColor));
            doc.text(title, margin + 5, innerY);
            innerY += 4.8;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(...darkTextColor);
        doc.text(lines, margin + 5, innerY);

        y += boxHeight + spacing;
    }

    function addKeyValueGrid(items) {
        const colWidth = (contentWidth - 6) / 2;
        const rowHeight = 16.5;
        
        for (let i = 0; i < items.length; i += 2) {
            checkPageBreak(rowHeight + 3);
            
            // Left column card
            const item1 = items[i];
            doc.setFillColor(...cardBgColor);
            doc.setDrawColor(...cardBorderColor);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, colWidth, rowHeight, 1.5, 1.5, 'FD');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(...secondaryColor);
            doc.text(item1[0], margin + 4, y + 4.8);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.0);
            doc.setTextColor(...darkTextColor);
            doc.text(doc.splitTextToSize(item1[1], colWidth - 8), margin + 4, y + 9.5);

            // Right column card
            if (i + 1 < items.length) {
                const item2 = items[i + 1];
                const x2 = margin + colWidth + 6;
                
                doc.setFillColor(...cardBgColor);
                doc.setDrawColor(...cardBorderColor);
                doc.setLineWidth(0.3);
                doc.roundedRect(x2, y, colWidth, rowHeight, 1.5, 1.5, 'FD');
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(...secondaryColor);
                doc.text(item2[0], x2 + 4, y + 4.8);
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.0);
                doc.setTextColor(...darkTextColor);
                doc.text(doc.splitTextToSize(item2[1], colWidth - 8), x2 + 4, y + 9.5);
            }

            y += rowHeight + 3;
        }
    }

    // ==========================================
    // COVER / TITLE HEADER BLOCK (Page 1)
    // ==========================================
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 5.5, 'F');

    y = 13.5;
    
    // Sub-header badge
    doc.setFillColor(...highlightBg);
    doc.setDrawColor(...highlightBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, 52, 6, 1.2, 1.2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...secondaryColor);
    doc.text('PROJECT SYNOPSIS REPORT', margin + 3.2, y + 4.2);

    y += 10.5;

    // Project Main Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...primaryColor);
    doc.text('AI-Powered-Placement-Resume-Intelligence-System', margin, y);

    y += 6.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...secondaryColor);
    doc.text('Semantic Applicant Tracking Evaluation & Career Readiness Engine', margin, y);

    y += 5.5;
    doc.setDrawColor(...cardBorderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, y, margin + contentWidth, y);

    y += 4.5;

    // Meta details card
    doc.setFillColor(...cardBgColor);
    doc.setDrawColor(...cardBorderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 14, 1.8, 1.8, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(...primaryColor);
    doc.text('Domain:', margin + 4, y + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkTextColor);
    doc.text('Artificial Intelligence, NLP & HR Technology', margin + 20, y + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Architecture:', margin + 4, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkTextColor);
    doc.text('MERN Stack (MongoDB, Express, React 19, Node.js) + Gemini AI', margin + 26, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Target Users:', margin + 112, y + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkTextColor);
    doc.text('Students, Job Seekers, Placement Cells', margin + 133, y + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Doc Type:', margin + 112, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkTextColor);
    doc.text('Technical Project Synopsis (v1.0)', margin + 133, y + 10);

    y += 18;

    // ==========================================
    // 1. PROJECT ABSTRACT
    // ==========================================
    drawSectionHeader('1. Project Abstract', 30);
    addParagraph(
        'The AI-Powered-Placement-Resume-Intelligence-System is an intelligent career technology platform designed to eliminate the screening gap between candidates and algorithmic Applicant Tracking Systems (ATS). Built upon a high-performance web architecture (React 19, Node.js, Express, and MongoDB), the application extracts unstructured text from PDF and DOCX resumes and executes deep semantic evaluation against target job descriptions using Google Gemini AI. Rather than relying on rigid keyword matching, the engine calculates holistic synergy scores, identifies missing competencies, breaks down skill ratings, and provides personalized, actionable recommendations that empower candidates to optimize their applications and secure placement.'
    );

    // ==========================================
    // 2. UN SUSTAINABLE DEVELOPMENT GOALS (SDG)
    // ==========================================
    drawSectionHeader('2. UN Sustainable Development Goals (SDG) Alignment', 40);
    addInfoBox(
        'Primary Alignment: SDG 8 - Decent Work and Economic Growth',
        'Target 8.5 (Full Employment & Decent Work): Empowers candidates to match their skills with real-world industry demands, significantly improving interview conversion rates.\nTarget 8.6 (Youth Employment & Skills): Equips young graduates and entry-level professionals with transparent feedback to reduce youth unemployment and transition into meaningful careers.',
        true,
        2.5
    );
    addBullet('SDG 4 (Quality Education - Target 4.4)', 'Highlights technical and soft skill gaps, providing educational descriptions of industry technologies to foster targeted continuous learning and vocational upskilling.');
    addBullet('SDG 9 (Industry, Innovation & Infrastructure - Target 9.5)', 'Applies state-of-the-art Generative AI and natural language processing to modernize workforce recruitment pipelines and applicant evaluation tools.');
    addBullet('SDG 10 (Reduced Inequalities - Target 10.2)', 'Democratizes access to high-end resume optimization and ATS evaluation, eliminating the paywall of expensive career coaching for underprivileged job seekers.');

    // ==========================================
    // 3. PROBLEM STATEMENT
    // ==========================================
    drawSectionHeader('3. Problem Statement', 35);
    addInfoBox(
        'Core Problem Statement',
        'In the modern recruitment landscape, over 75% of candidate resumes are filtered out by automated Applicant Tracking Systems (ATS) before ever reaching a human recruiter, leaving job seekers—especially students and fresh graduates—trapped in a cycle of silent rejections without constructive feedback. Candidates frequently struggle to identify critical skill gaps, lack insight into how automated screening algorithms evaluate their profiles against specific job descriptions, and often cannot afford expensive professional career coaching services. Consequently, qualified applicants fail to advance simply due to semantic misalignment, missing domain keywords, or improper resume structuring. The AI-Powered-Placement-Resume-Intelligence-System addresses this challenge by providing an intelligent evaluation platform that parses resumes, performs semantic matching against target job descriptions using Google Gemini AI, accurately highlights missing skills, and delivers actionable, real-time ATS optimization tips to significantly enhance candidate employability.',
        false,
        2
    );

    // ==========================================
    // 4. PROBLEM DESCRIPTION & PAIN POINTS
    // ==========================================
    drawSectionHeader('4. Problem Description', 35);
    addParagraph(
        'The widespread adoption of automated Applicant Tracking Systems (ATS) by enterprise recruiters has fundamentally shifted how hiring occurs. However, this automation introduces severe inefficiencies and opacity that negatively impact candidate outcomes:'
    );
    addBullet('Algorithmic Opacity ("The Black Box")', 'Candidates receive blanket rejection emails with zero explanation, preventing them from learning why their profile failed or how they can improve.');
    addBullet('Semantic Vocabulary & Keyword Disconnect', 'Job seekers often have the necessary background but fail to use the precise terminology or phrasing prioritized by automated parser filters.');
    addBullet('Document Parsing Fragility', 'Modern resumes formatted with multi-column tables, graphics, or complex styling often suffer from corrupted parsing in legacy ATS parsers, dropping crucial qualifications.');
    addBullet('Socio-Economic Barriers', 'Commercial ATS simulators and certified resume consultants cost hundreds of dollars, creating an unfair competitive disadvantage for candidates with fewer financial resources.');

    // ==========================================
    // 5. PROJECT OBJECTIVES
    // ==========================================
    drawSectionHeader('5. Project Objectives', 35);
    addBullet('Multi-Format Ingestion', 'Develop robust extraction pipelines supporting both PDF and Microsoft Word (DOCX) files directly in-memory.');
    addBullet('Semantic AI Evaluation', 'Integrate Google Gemini 2.5 Flash API to perform contextual, semantic alignment between resume content and job specifications.');
    addBullet('Quantitative ATS Scoring', 'Generate an objective, multi-dimensional score (0-100%) indicating synergy probability across required competencies.');
    addBullet('Granular Skills Gap Analysis', 'Identify and list missing domain-specific skills alongside educational explanations of key frameworks and technologies.');
    addBullet('Actionable Prescriptive Feedback', 'Deliver real-time ATS bypass advice, formatting modifications, and bullet-point enhancements.');
    addBullet('User Security & History', 'Implement secure JWT-based authentication with bcrypt encryption, MongoDB persistence, and downloadable PDF reports.');

    // ==========================================
    // 6. SYSTEM ARCHITECTURE & MODULES
    // ==========================================
    drawSectionHeader('6. System Architecture & Modules', 40);
    addKeyValueGrid([
        ['Frontend Client (React 19)', 'Vite build engine, responsive UI components, Lucide icons, and real-time analysis dashboard.'],
        ['Backend API Server', 'Node.js & Express.js REST API managing parsing, token validation, and AI orchestration.'],
        ['Document Parsing Engine', 'pdf-parse and mammoth libraries for fast, reliable in-memory extraction of text and metadata.'],
        ['Generative AI Core', 'Google Gemini 2.5 Flash executing structured JSON prompt engineering for recruiter-grade evaluation.'],
        ['Database Persistence', 'MongoDB Atlas / local database storing user credentials and historic analysis runs via Mongoose.'],
        ['Export & Reporting', 'Client-side PDF generation (html2pdf.js) enabling portable sharing of diagnostic ATS audit reports.']
    ]);

    // ==========================================
    // 7. TECHNICAL SPECIFICATIONS & REQUIREMENTS
    // ==========================================
    drawSectionHeader('7. Technical Specifications & Requirements', 35);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...primaryColor);
    doc.text('Software Stack & Core Libraries:', margin, y);
    y += 4.5;

    addBullet('Frontend Ecosystem', 'React v19, Vite v8, Axios, Lucide React, React Router DOM, html2pdf.js');
    addBullet('Backend & APIs', 'Node.js v20+, Express.js v5, Multer (in-memory file upload), @google/genai SDK');
    addBullet('Security & Authentication', 'JSON Web Tokens (JWT), bcryptjs password hashing, Nodemailer (SMTP OTP reset)');
    addBullet('Database Architecture', 'MongoDB v6+ / MongoDB Atlas with Mongoose ODM schemas (User, Analysis)');

    y += 1.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...primaryColor);
    doc.text('Hardware Specifications:', margin, y);
    y += 4.5;

    addBullet('Development / Server', 'Minimum 4 GB RAM, Dual-Core 2.0 GHz Processor, 10 GB Storage, Active Internet Connection.');
    addBullet('Client / End User', 'Any modern web browser (Chrome, Edge, Firefox, Safari) across desktop or mobile devices.');

    // ==========================================
    // 8. WORKFLOW & METHODOLOGY
    // ==========================================
    drawSectionHeader('8. Workflow & Methodology', 35);
    addBullet('Step 1 (Input Submission)', 'Candidate uploads their resume (PDF/DOCX) and pastes the target job description into the web portal.');
    addBullet('Step 2 (Text Extraction)', 'The backend extracts raw text using pdf-parse or mammoth while preserving semantic context.');
    addBullet('Step 3 (Prompt Orchestration)', 'A specialized recruiter prompt and the extracted texts are dispatched to Google Gemini 2.5 Flash.');
    addBullet('Step 4 (JSON Parsing & Scoring)', 'Gemini returns structured JSON containing scores, missing skills, skill breakdowns, and ATS suggestions.');
    addBullet('Step 5 (Storage & Visualization)', 'The analysis is saved to MongoDB and rendered as an interactive, visual dashboard with PDF export capability.');

    // ==========================================
    // 9. EXPECTED OUTCOMES & SOCIETAL IMPACT
    // ==========================================
    drawSectionHeader('9. Expected Outcomes & Impact', 30);
    addBullet('Increased Interview Callbacks', 'Job seekers optimize their resumes to pass automated screening thresholds, boosting interview invitations.');
    addBullet('Transparent Skills Gap Insights', 'Clear visibility into missing competencies allows students to focus their learning on high-demand skills.');
    addBullet('Equitable Career Advancement', 'Free and instantaneous ATS benchmarking levels the playing field for candidates of all economic backgrounds.');
    addBullet('Campus Placement Efficiency', 'Universities and career centers can integrate the platform to evaluate graduating batches at scale.');

    // ==========================================
    // ADD PAGE NUMBERS & RUNNING HEADERS / FOOTERS
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Header (pages > 1)
        if (i > 1) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...mutedTextColor);
            doc.text('AI-Powered-Placement-Resume-Intelligence-System — Project Synopsis', margin, 12);
            doc.text('Technical & Academic Synopsis Report', pageWidth - margin - 50, 12);
            doc.setDrawColor(...cardBorderColor);
            doc.setLineWidth(0.3);
            doc.line(margin, 14, pageWidth - margin, 14);
        }

        // Footer (all pages)
        doc.setDrawColor(...cardBorderColor);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...mutedTextColor);
        doc.text('AI-Powered-Placement-Resume-Intelligence-System © 2026 | Powered by Google Gemini AI', margin, pageHeight - 6.5);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 17, pageHeight - 6.5);
    }

    const outputFileName = 'AI-Powered-Placement-Resume-Intelligence-System-Synopsis.pdf';
    const outputPath = path.resolve(__dirname, outputFileName);
    const pdfData = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(outputPath, pdfData);

    // Also update the earlier named file so both links work
    const legacyPath = path.resolve(__dirname, 'AI_Resume_Analyzer_Synopsis.pdf');
    fs.writeFileSync(legacyPath, pdfData);

    console.log(`PDF successfully created at: ${outputPath}`);
    console.log(`Total Pages: ${totalPages}`);
    console.log(`File Size: ${(pdfData.length / 1024).toFixed(2)} KB`);
}

createSynopsisPDF();
