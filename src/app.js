// Main Application Logic with Firebase Integration

// Global variables
let casesData = [];
let prohibitedDocumentsData = [];
let usersData = [];
let currentCaseId = null;
let currentDocumentId = null;
let currentUser = null;
let dataTables = {};
let charts = {};

// Prohibited case types
const prohibitedTypes = [
    'prohibited-teenage-pregnancy',
    'prohibited-sexual-harassment',
    'prohibited-drug-addiction',
    'prohibited-mental-health'
];

const prohibitedDisplayNames = {
    'prohibited-teenage-pregnancy': 'Teenage Pregnancy (Prohibited)',
    'prohibited-sexual-harassment': 'Sexual Harassment (Prohibited)',
    'prohibited-drug-addiction': 'Drug Addiction (Prohibited)',
    'prohibited-mental-health': 'Mental Health Issues (Prohibited)'
};

// Utility functions
function showLoading() {
    $('#loadingSpinner').css('display', 'flex');
}

function hideLoading() {
    $('#loadingSpinner').hide();
}

function showNotification(message, type = 'success') {
    const alertClass = type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info';
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    const notification = $(`
        <div class="alert alert-${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            <i class="fas fa-${icon}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `);
    $('body').append(notification);
    setTimeout(() => {
        notification.alert('close');
    }, 5000);
}

function getStatusClass(status) {
    switch(status) {
        case 'resolved': return 'success';
        case 'pending': return 'warning';
        case 'monitoring': return 'info';
        case 'referred': return 'secondary';
        default: return 'secondary';
    }
}

function getRoleClass(role) {
    switch(role) {
        case 'admin': return 'primary';
        case 'subadmin': return 'info';
        case 'counselor': return 'warning';
        case 'teacher': return 'secondary';
        default: return 'secondary';
    }
}

// ==================== FIREBASE DATA OPERATIONS ====================

async function loadCasesFromFirestore() {
    try {
        const snapshot = await db.collection('cases').orderBy('date', 'desc').get();
        casesData = [];
        snapshot.forEach(doc => {
            casesData.push({ id: doc.id, ...doc.data() });
        });
        return casesData;
    } catch (error) {
        console.error('Error loading cases:', error);
        return [];
    }
}

async function addCaseToFirestore(caseData) {
    try {
        const docRef = await db.collection('cases').add({
            ...caseData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding case:', error);
        throw error;
    }
}

async function updateCaseInFirestore(id, data) {
    try {
        await db.collection('cases').doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating case:', error);
        throw error;
    }
}

async function deleteCaseFromFirestore(id) {
    try {
        await db.collection('cases').doc(id).delete();
        return true;
    } catch (error) {
        console.error('Error deleting case:', error);
        throw error;
    }
}

async function loadDocumentsFromFirestore() {
    try {
        const snapshot = await db.collection('documents').orderBy('dateSent', 'desc').get();
        prohibitedDocumentsData = [];
        snapshot.forEach(doc => {
            prohibitedDocumentsData.push({ id: doc.id, ...doc.data() });
        });
        return prohibitedDocumentsData;
    } catch (error) {
        console.error('Error loading documents:', error);
        return [];
    }
}

async function addDocumentToFirestore(docData) {
    try {
        const docRef = await db.collection('documents').add({
            ...docData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding document:', error);
        throw error;
    }
}

async function loadUsersFromFirestore() {
    try {
        const snapshot = await db.collection('users').get();
        usersData = [];
        snapshot.forEach(doc => {
            usersData.push({ id: doc.id, ...doc.data() });
        });
        return usersData;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

async function addUserToFirestore(userData) {
    try {
        const docRef = await db.collection('users').add({
            ...userData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
}

// ==================== UI POPULATION FUNCTIONS ====================

function populateDataTables() {
    const recordsBody = $('#records-body');
    const recordsFullBody = $('#records-full-body');
    
    recordsBody.empty();
    recordsFullBody.empty();
    
    casesData.forEach(caseItem => {
        const statusClass = getStatusClass(caseItem.statusValue);
        const classification = caseItem.isProhibited ? 
            '<span class="badge bg-danger">⚠️ Prohibited</span>' : 
            '<span class="badge bg-success">Regular</span>';
        
        // Main records table
        const row = `
            <tr>
                <td>${caseItem.lrn}</td>
                <td>${caseItem.name}</td>
                <td>${caseItem.grade}</td>
                <td>${caseItem.type}</td>
                <td><span class="badge bg-${statusClass}">${caseItem.status}</span></td>
                <td>${caseItem.date}</td>
                <td>${classification}</td>
                <td>
                    <button class="btn btn-sm btn-info view-btn" data-id="${caseItem.id || caseItem.lrn}"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${caseItem.id || caseItem.lrn}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${caseItem.id || caseItem.lrn}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        recordsBody.append(row);
        
        // Full records table
        const fullRow = `
            <tr>
                <td>${caseItem.lrn}</td>
                <td>${caseItem.name}</td>
                <td>${caseItem.grade}</td>
                <td>${caseItem.type}</td>
                <td><span class="badge bg-${statusClass}">${caseItem.status}</span></td>
                <td>${caseItem.date}</td>
                <td>${caseItem.updated || caseItem.date}</td>
                <td>${classification}</td>
                <td>
                    <button class="btn btn-sm btn-info view-btn" data-id="${caseItem.id || caseItem.lrn}"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${caseItem.id || caseItem.lrn}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${caseItem.id || caseItem.lrn}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        recordsFullBody.append(fullRow);
    });
    
    // Initialize DataTables if not already initialized
    if ($.fn.DataTable.isDataTable('#records-table')) {
        $('#records-table').DataTable().destroy();
    }
    if ($.fn.DataTable.isDataTable('#records-table-full')) {
        $('#records-table-full').DataTable().destroy();
    }
    
    dataTables.records = $('#records-table').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
    });
    
    dataTables.recordsFull = $('#records-table-full').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
    });
}

function populateUsersTable() {
    const usersBody = $('#users-body');
    usersBody.empty();
    
    usersData.forEach(user => {
        const roleClass = getRoleClass(user.role);
        const statusClass = user.status === 'active' ? 'success' : 'danger';
        const row = `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-${roleClass}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
                <td><span class="badge bg-${statusClass}">${user.status}</span></td>
                <td>${user.lastLogin || 'Never'}</td>
                <td>
                    <button class="btn btn-sm btn-info"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
        usersBody.append(row);
    });
    
    if ($.fn.DataTable.isDataTable('#users-table')) {
        $('#users-table').DataTable().destroy();
    }
    
    dataTables.users = $('#users-table').DataTable({
        responsive: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]]
    });
}

function updateProhibitedCasesList() {
    const prohibitedCases = casesData.filter(c => c.isProhibited);
    const listElement = $('#prohibited-cases-list');
    listElement.empty();
    
    if (prohibitedCases.length === 0) {
        listElement.html('<tr><td colspan="6" class="text-center">No prohibited cases found</td></tr>');
        return;
    }
    
    prohibitedCases.forEach(caseItem => {
        const statusClass = getStatusClass(caseItem.statusValue);
        const row = `
            <tr>
                <td>${caseItem.lrn}</td>
                <td>${caseItem.name}</td>
                <td>${caseItem.type}</td>
                <td><span class="badge bg-${statusClass}">${caseItem.status}</span></td>
                <td>${caseItem.date}</td>
                <td>
                    <button class="btn btn-sm btn-info view-case-btn" data-id="${caseItem.id || caseItem.lrn}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger create-doc-btn" data-id="${caseItem.id || caseItem.lrn}">
                        <i class="fas fa-file-alt"></i> Create Doc
                    </button>
                </td>
            </tr>
        `;
        listElement.append(row);
    });
}

function updateProhibitedDocumentsLists() {
    if (!currentUser) return;
    
    const sentDocs = prohibitedDocumentsData.filter(doc => doc.sender === currentUser.email);
    const receivedDocs = prohibitedDocumentsData.filter(doc => doc.recipient === currentUser.email);
    
    const sentList = $('#sent-documents-list');
    sentList.empty();
    
    if (sentDocs.length === 0) {
        sentList.html('<div class="alert alert-info">No sent prohibited documents</div>');
    } else {
        sentDocs.forEach(doc => {
            const docElement = createDocumentElement(doc, 'sent');
            sentList.append(docElement);
        });
    }
    
    const receivedList = $('#received-documents-list');
    receivedList.empty();
    
    if (receivedDocs.length === 0) {
        receivedList.html('<div class="alert alert-info">No received prohibited documents</div>');
    } else {
        receivedDocs.forEach(doc => {
            const docElement = createDocumentElement(doc, 'received');
            receivedList.append(docElement);
        });
    }
}

function createDocumentElement(doc, type) {
    const date = new Date(doc.dateSent).toLocaleString();
    const isViewed = doc.viewedBy && doc.viewedBy.some(v => v.user === currentUser?.email);
    
    return `
        <div class="document-item prohibited">
            <div class="document-header">
                <span class="document-title">${doc.title}</span>
                <span class="badge bg-danger">Prohibited</span>
            </div>
            <div class="document-meta">
                <div><strong>${type === 'sent' ? 'To:' : 'From:'}</strong> ${type === 'sent' ? doc.recipient : doc.senderName}</div>
                <div><strong>Date:</strong> ${date}</div>
                ${doc.linkedStudentName ? `<div><strong>Student:</strong> ${doc.linkedStudentName}</div>` : ''}
                <div><strong>Status:</strong> ${isViewed ? '<span class="badge bg-success">Viewed</span>' : '<span class="badge bg-warning">Unviewed</span>'}</div>
            </div>
            <div class="document-actions">
                <button class="btn btn-sm btn-danger view-prohibited-doc-btn" data-id="${doc.id}">
                    <i class="fas fa-eye"></i> View Document
                </button>
            </div>
        </div>
    `;
}

function updateCaseReferenceDropdown() {
    const prohibitedCases = casesData.filter(c => c.isProhibited);
    const dropdown = $('#doc-case-reference');
    dropdown.empty();
    dropdown.append('<option value="">Select a prohibited case (optional)</option>');
    
    prohibitedCases.forEach(caseItem => {
        dropdown.append(`<option value="${caseItem.id || caseItem.lrn}">${caseItem.name} - ${caseItem.type}</option>`);
    });
}

function updateStatistics() {
    const activeCases = casesData.filter(c => c.statusValue !== 'resolved').length;
    const prohibitedCases = casesData.filter(c => c.isProhibited).length;
    const resolvedCases = casesData.filter(c => c.statusValue === 'resolved').length;
    const totalStudents = casesData.length;
    
    $('#total-students').text(totalStudents);
    $('#active-cases').text(activeCases);
    $('#prohibited-cases').text(prohibitedCases);
    $('#resolved-cases').text(resolvedCases);
}

function initializeCharts() {
    const caseTypes = ['Bullying', 'Academic', 'Behavioral', 'Attendance', 'Teen Pregnancy', 'Sexual Harassment', 'Drug Addiction', 'Mental Health', 'Other'];
    const caseTypeCounts = caseTypes.map(type => {
        if (type === 'Teen Pregnancy') return casesData.filter(c => c.type.includes('Teenage Pregnancy')).length;
        if (type === 'Sexual Harassment') return casesData.filter(c => c.type.includes('Sexual Harassment')).length;
        if (type === 'Drug Addiction') return casesData.filter(c => c.type.includes('Drug Addiction')).length;
        if (type === 'Mental Health') return casesData.filter(c => c.type.includes('Mental Health')).length;
        return casesData.filter(c => c.type.includes(type) && !c.isProhibited).length;
    });
    
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthLabels.map((month, index) => {
        return casesData.filter(c => {
            const caseDate = new Date(c.date);
            return caseDate.getMonth() === index && caseDate.getFullYear() === 2025;
        }).length;
    });
    
    // Destroy existing charts if they exist
    if (charts.casesChart) {
        charts.casesChart.destroy();
    }
    if (charts.trendChart) {
        charts.trendChart.destroy();
    }
    
    // Cases by Type Chart
    const casesCtx = document.getElementById('casesChart').getContext('2d');
    charts.casesChart = new Chart(casesCtx, {
        type: 'bar',
        data: {
            labels: caseTypes,
            datasets: [{
                label: 'Cases by Type',
                data: caseTypeCounts,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                    'rgba(141, 110, 99, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            onClick: function(e, item) {
                if (item.length > 0) {
                    const index = item[0].index;
                    const caseType = caseTypes[index];
                    if (['Teen Pregnancy', 'Sexual Harassment', 'Drug Addiction', 'Mental Health'].includes(caseType)) {
                        showProhibitedCases();
                    } else {
                        filterCasesByType(caseType);
                    }
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // Monthly Trend Chart
    const trendCtx = document.getElementById('monthlyTrendChart').getContext('2d');
    charts.trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Cases per Month',
                data: monthlyData,
                fill: false,
                borderColor: 'rgb(158, 14, 18)',
                backgroundColor: 'rgba(158, 14, 18, 0.1)',
                tension: 0.1,
                pointBackgroundColor: 'rgb(158, 14, 18)',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            onClick: function(e, item) {
                if (item.length > 0) {
                    const index = item[0].dataIndex;
                    const month = monthLabels[index];
                    showMonthlyCases(month, 2025);
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ==================== EXPORT FUNCTIONS ====================

function getLogoBase64() {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = 'logo.png';
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = function() {
            resolve(null);
        };
    });
}

async function applyPDFWatermark(doc, isConfidential = false) {
    try {
        const logoBase64 = await getLogoBase64();
        if (logoBase64) {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = logoBase64;
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.globalAlpha = 0.14;
            ctx.drawImage(img, 0, 0, 200, 200);
            const transparentLogo = canvas.toDataURL('image/png');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.addImage(transparentLogo, 'PNG', (pageWidth - 200) / 2, (pageHeight - 200) / 2, 200, 200);
        }
    } catch (e) {
        console.warn('Could not add logo watermark to PDF:', e);
    }
    
    if (isConfidential) {
        doc.setFontSize(80);
        doc.setTextColor(180, 180, 180);
        doc.setFont('helvetica', 'bold');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.text('CONFIDENTIAL', pageWidth/2 - 100, pageHeight/2 + 10, { 
            angle: 30, 
            opacity: 0.14,
            align: 'center'
        });
    }
}

// ==================== EVENT HANDLERS ====================

$(document).ready(async function() {
    showLoading();
    
    // Initialize Firebase Auth Listener
    firebase.auth().onAuthStateChanged(async function(user) {
        if (user) {
            currentUser = user;
            console.log('User authenticated:', user.email);
            
            // Load data from Firestore
            await Promise.all([
                loadCasesFromFirestore(),
                loadDocumentsFromFirestore(),
                loadUsersFromFirestore()
            ]);
            
            // Populate UI
            populateDataTables();
            populateUsersTable();
            updateProhibitedCasesList();
            updateProhibitedDocumentsLists();
            updateCaseReferenceDropdown();
            updateStatistics();
            setTimeout(() => initializeCharts(), 200);
            
            // Show dashboard
            $('#login-page').hide();
            $('#superadmin-dashboard').show();
            hideLoading();
        } else {
            // User is signed out
            currentUser = null;
            $('#superadmin-dashboard').hide();
            $('#login-page').show();
            hideLoading();
        }
    });
    
    // Login Form Handling
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#email').val();
        const password = $('#password').val();
        const terms = $('#terms').is(':checked');
        
        if (!terms) {
            showNotification('You must accept the Terms & Conditions before logging in.', 'error');
            return;
        }
        
        showLoading();
        
        // Sign in with Firebase Auth
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                hideLoading();
                // User will be handled by auth state listener
            })
            .catch((error) => {
                hideLoading();
                console.error('Login error:', error);
                
                // Fallback to demo accounts if Firebase Auth fails
                if (email === 'altagracia.florita@deped.gov.ph' && password === 'password213!!altagracia') {
                    currentUser = { email: email, role: 'superadmin', name: 'Altagracia Florita', uid: 'demo_superadmin' };
                    $('#login-page').hide();
                    $('#superadmin-dashboard').show();
                    loadDataFromLocalStorage();
                    showNotification('Logged in as Super Admin (Demo Mode)', 'success');
                } else if (email === 'subadmin@subicnhs.edu.ph' && password === 'subadmin123') {
                    currentUser = { email: email, role: 'subadmin', name: 'Sub Admin User', uid: 'demo_subadmin' };
                    $('#login-page').hide();
                    $('#superadmin-dashboard').show();
                    loadDataFromLocalStorage();
                    showNotification('Logged in as Sub Admin (Demo Mode)', 'success');
                } else if (email === 'admin@subicnhs.edu.ph' && password === 'admin123') {
                    currentUser = { email: email, role: 'admin', name: 'Admin User', uid: 'demo_admin' };
                    $('#login-page').hide();
                    $('#superadmin-dashboard').show();
                    loadDataFromLocalStorage();
                    showNotification('Logged in as Admin (Demo Mode)', 'success');
                } else {
                    showNotification('Invalid email or password. Please try again.', 'error');
                }
            });
    });
    
    // Load data from localStorage for demo mode
    function loadDataFromLocalStorage() {
        try {
            const savedCases = localStorage.getItem('snhs_cms_cases');
            if (savedCases) {
                casesData = JSON.parse(savedCases);
            } else {
                initializeSampleData();
            }
            
            const savedDocuments = localStorage.getItem('snhs_cms_prohibited_documents');
            if (savedDocuments) {
                prohibitedDocumentsData = JSON.parse(savedDocuments);
            }
            
            const savedUsers = localStorage.getItem('snhs_cms_users');
            if (savedUsers) {
                usersData = JSON.parse(savedUsers);
            } else {
                initializeUsersData();
            }
            
            populateDataTables();
            populateUsersTable();
            updateProhibitedCasesList();
            updateProhibitedDocumentsLists();
            updateCaseReferenceDropdown();
            updateStatistics();
            setTimeout(() => initializeCharts(), 200);
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            initializeSampleData();
            initializeUsersData();
        }
    }
    
    function initializeSampleData() {
        casesData = [
            {
                id: 'case1',
                lrn: '123456789012',
                name: 'Dela Cruz, Juan A.',
                grade: 'Grade 10',
                type: 'Bullying',
                typeValue: 'bullying',
                status: 'Pending',
                statusValue: 'pending',
                date: '2025-10-15',
                updated: '2025-10-18',
                incident: 'Reported for bullying a younger student in the cafeteria.',
                actions: 'Counseling session scheduled with guidance counselor. Parents notified.',
                isProhibited: false,
                reportedBy: 'admin@subicnhs.edu.ph'
            },
            {
                id: 'case2',
                lrn: '234567890123',
                name: 'Santos, Maria B.',
                grade: 'Grade 11',
                type: 'Academic Deficiency',
                typeValue: 'academic',
                status: 'Resolved',
                statusValue: 'resolved',
                date: '2025-10-10',
                updated: '2025-10-20',
                incident: 'Failing grades in Mathematics and Science subjects.',
                actions: 'Additional tutoring arranged. Progress monitored weekly.',
                isProhibited: false,
                reportedBy: 'admin@subicnhs.edu.ph'
            },
            {
                id: 'case3',
                lrn: '345678901234',
                name: 'Garcia, Pedro C.',
                grade: 'Grade 9',
                type: 'Sexual Harassment (Prohibited)',
                typeValue: 'prohibited-sexual-harassment',
                status: 'Under Monitoring',
                statusValue: 'monitoring',
                date: '2025-10-05',
                updated: '2025-10-19',
                incident: 'Reported for inappropriate behavior towards classmates.',
                actions: 'Immediate counseling. Parents notified. Case referred to Division Office.',
                isProhibited: true,
                reportedBy: 'admin@subicnhs.edu.ph'
            },
            {
                id: 'case4',
                lrn: '456789012345',
                name: 'Reyes, Ana Marie D.',
                grade: 'Grade 12',
                type: 'Attendance Problem',
                typeValue: 'attendance',
                status: 'Referred to Guidance',
                statusValue: 'referred',
                date: '2025-09-28',
                updated: '2025-10-15',
                incident: 'Excessive absenteeism affecting academic performance.',
                actions: 'Meeting with parents scheduled. Referred to guidance counselor for assessment.',
                isProhibited: false,
                reportedBy: 'admin@subicnhs.edu.ph'
            },
            {
                id: 'case5',
                lrn: '567890123456',
                name: 'Mendoza, Karla P.',
                grade: 'Grade 11',
                type: 'Teenage Pregnancy (Prohibited)',
                typeValue: 'prohibited-teenage-pregnancy',
                status: 'Under Monitoring',
                statusValue: 'monitoring',
                date: '2025-10-12',
                updated: '2025-10-20',
                incident: 'Student confirmed to be pregnant. Requires special accommodation.',
                actions: 'Meeting with parents conducted. Health services notified. Academic accommodations arranged.',
                isProhibited: true,
                reportedBy: 'admin@subicnhs.edu.ph'
            }
        ];
        
        prohibitedDocumentsData = casesData.filter(c => c.isProhibited).map((caseItem, index) => ({
            id: 'doc_sample_' + index,
            title: `Prohibited Case Report: ${caseItem.name}`,
            recipient: 'admin@subicnhs.edu.ph',
            sender: 'altagracia.florita@deped.gov.ph',
            senderName: 'Altagracia Florita',
            classification: 'prohibited',
            content: `CONFIDENTIAL PROHIBITED CASE REPORT\n\nStudent: ${caseItem.name}\nLRN: ${caseItem.lrn}\nCase Type: ${caseItem.type}\nDate Reported: ${caseItem.date}\n\nIncident Details:\n${caseItem.incident}\n\nActions Taken:\n${caseItem.actions}\n\nThis document contains prohibited/sensitive information and is encrypted.`,
            encryptionCode: 'SNHS2025',
            dateSent: '2025-10-19T10:30:00Z',
            status: 'sent',
            isEncrypted: true,
            isProhibited: true,
            linkedCase: caseItem.id,
            linkedStudentName: caseItem.name,
            viewedBy: []
        }));
        
        localStorage.setItem('snhs_cms_cases', JSON.stringify(casesData));
        localStorage.setItem('snhs_cms_prohibited_documents', JSON.stringify(prohibitedDocumentsData));
    }
    
    function initializeUsersData() {
        usersData = [
            {
                id: 'user1',
                name: 'Altagracia Florita',
                email: 'altagracia.florita@deped.gov.ph',
                role: 'superadmin',
                status: 'active',
                lastLogin: '2025-10-20 14:32'
            },
            {
                id: 'user2',
                name: 'Admin User',
                email: 'admin@subicnhs.edu.ph',
                role: 'admin',
                status: 'active',
                lastLogin: '2025-10-19 09:45'
            },
            {
                id: 'user3',
                name: 'Sub Admin User',
                email: 'subadmin@subicnhs.edu.ph',
                role: 'subadmin',
                status: 'active',
                lastLogin: '2025-10-18 16:20'
            }
        ];
        localStorage.setItem('snhs_cms_users', JSON.stringify(usersData));
    }
    
    // Navigation menu handling
    $('.sidebar-menu a').on('click', function(e) {
        e.preventDefault();
        
        $('.sidebar-menu li').removeClass('active');
        $(this).parent().addClass('active');
        
        const page = $(this).data('page');
        $('.page-content').hide();
        $(`#${page}-page`).show();
        
        if (page === 'dashboard') {
            updateStatistics();
            setTimeout(() => initializeCharts(), 100);
        } else if (page === 'prohibited-documents') {
            updateProhibitedCasesList();
            updateProhibitedDocumentsLists();
            updateCaseReferenceDropdown();
        }
    });
    
    // Logout functionality
    $('#logout-btn').on('click', function(e) {
        e.preventDefault();
        firebase.auth().signOut().then(() => {
            currentUser = null;
            $('.dashboard').hide();
            $('#login-page').show();
            $('#email').val('');
            $('#password').val('');
            $('#terms').prop('checked', false);
            showNotification('Logged out successfully', 'info');
        }).catch((error) => {
            console.error('Logout error:', error);
            // Fallback logout
            currentUser = null;
            $('.dashboard').hide();
            $('#login-page').show();
            $('#email').val('');
            $('#password').val('');
            $('#terms').prop('checked', false);
        });
    });
    
    // Case form submission
    $('#case-form').on('submit', async function(e) {
        e.preventDefault();
        showLoading();
        
        const lrn = $('#lrn').val();
        const studentName = $('#student-name').val();
        const gradeLevel = $('#grade-level').val();
        const caseType = $('#case-type').val();
        const incident = $('#incident').val();
        const actions = $('#actions').val();
        const remarks = $('#remarks').val();
        
        const isProhibited = prohibitedTypes.includes(caseType);
        let caseTypeDisplay = '';
        if (isProhibited) {
            caseTypeDisplay = prohibitedDisplayNames[caseType] || caseType;
        } else {
            switch(caseType) {
                case 'bullying': caseTypeDisplay = 'Bullying'; break;
                case 'academic': caseTypeDisplay = 'Academic Deficiency'; break;
                case 'behavioral': caseTypeDisplay = 'Behavioral Issue'; break;
                case 'attendance': caseTypeDisplay = 'Attendance Problem'; break;
                default: caseTypeDisplay = 'Other';
            }
        }
        
        const newCase = {
            lrn: lrn,
            name: studentName,
            grade: 'Grade ' + gradeLevel,
            type: caseTypeDisplay,
            typeValue: caseType,
            status: $('#remarks option:selected').text(),
            statusValue: remarks,
            date: new Date().toISOString().split('T')[0],
            updated: new Date().toISOString().split('T')[0],
            incident: incident,
            actions: actions,
            isProhibited: isProhibited,
            reportedBy: currentUser ? currentUser.email : 'system'
        };
        
        try {
            // Add to Firestore or localStorage
            if (currentUser && currentUser.uid && !currentUser.uid.startsWith('demo_')) {
                const docId = await addCaseToFirestore(newCase);
                newCase.id = docId;
            } else {
                // Demo mode - generate local ID
                newCase.id = 'case_' + Date.now();
            }
            
            casesData.push(newCase);
            
            if (isProhibited) {
                createProhibitedDocumentFromCase(newCase);
            }
            
            populateDataTables();
            updateProhibitedCasesList();
            updateCaseReferenceDropdown();
            
            localStorage.setItem('snhs_cms_cases', JSON.stringify(casesData));
            localStorage.setItem('snhs_cms_prohibited_documents', JSON.stringify(prohibitedDocumentsData));
            
            updateStatistics();
            $('#case-form')[0].reset();
            hideLoading();
            showNotification('Case submitted successfully!', 'success');
        } catch (error) {
            hideLoading();
            showNotification('Error submitting case: ' + error.message, 'error');
        }
    });
    
    function createProhibitedDocumentFromCase(caseItem) {
        const newDocument = {
            id: 'doc_' + Date.now(),
            title: `Prohibited Case Report: ${caseItem.name}`,
            recipient: 'admin@subicnhs.edu.ph',
            sender: currentUser ? currentUser.email : 'system',
            senderName: currentUser ? currentUser.name : 'System',
            classification: 'prohibited',
            content: `CONFIDENTIAL PROHIBITED CASE REPORT\n\nStudent: ${caseItem.name}\nLRN: ${caseItem.lrn}\nCase Type: ${caseItem.type}\nDate Reported: ${caseItem.date}\n\nIncident Details:\n${caseItem.incident}\n\nActions Taken:\n${caseItem.actions}\n\nThis document was automatically generated from a prohibited case record.`,
            encryptionCode: 'CASE' + caseItem.lrn.slice(-6),
            dateSent: new Date().toISOString(),
            status: 'sent',
            isEncrypted: true,
            isProhibited: true,
            linkedCase: caseItem.id,
            linkedStudentName: caseItem.name,
            viewedBy: []
        };
        
        prohibitedDocumentsData.push(newDocument);
        return newDocument;
    }
    
    // Send prohibited document form
    $('#send-prohibited-document-form').on('submit', async function(e) {
        e.preventDefault();
        showLoading();
        
        const title = $('#doc-title').val();
        const recipient = $('#doc-recipient').val();
        const caseReference = $('#doc-case-reference').val();
        const content = $('#doc-content').val();
        const encryptionCode = $('#doc-encryption-code').val();
        
        let linkedCase = null;
        if (caseReference) {
            linkedCase = casesData.find(c => c.id === caseReference || c.lrn === caseReference);
        }
        
        const newDocument = {
            id: 'doc_' + Date.now(),
            title: title,
            recipient: recipient,
            sender: currentUser ? currentUser.email : 'system',
            senderName: currentUser ? currentUser.name : 'System',
            classification: 'prohibited',
            content: content,
            encryptionCode: encryptionCode,
            dateSent: new Date().toISOString(),
            status: 'sent',
            isEncrypted: true,
            isProhibited: true,
            linkedCase: caseReference,
            linkedStudentName: linkedCase ? linkedCase.name : null,
            viewedBy: []
        };
        
        try {
            if (currentUser && currentUser.uid && !currentUser.uid.startsWith('demo_')) {
                await addDocumentToFirestore(newDocument);
            }
            
            prohibitedDocumentsData.push(newDocument);
            localStorage.setItem('snhs_cms_prohibited_documents', JSON.stringify(prohibitedDocumentsData));
            
            updateProhibitedDocumentsLists();
            updateCaseReferenceDropdown();
            $('#send-prohibited-document-form')[0].reset();
            hideLoading();
            showNotification('Prohibited document sent successfully with encryption!', 'success');
        } catch (error) {
            hideLoading();
            showNotification('Error sending document: ' + error.message, 'error');
        }
    });
    
    // View and Edit event handlers
    $(document).on('click', '.view-btn', function() {
        const id = $(this).data('id');
        const caseData = casesData.find(c => c.id === id || c.lrn === id);
        if (caseData) {
            $('#view-lrn').text(caseData.lrn);
            $('#view-name').text(caseData.name);
            $('#view-grade').text(caseData.grade);
            $('#view-type').text(caseData.type);
            $('#view-status').text(caseData.status);
            $('#view-date').text(caseData.date);
            $('#view-updated').text(caseData.updated || caseData.date);
            $('#view-incident').text(caseData.incident);
            $('#view-actions').text(caseData.actions);
            $('#viewCaseModal').modal('show');
        }
    });
    
    $(document).on('click', '.edit-btn', function() {
        const id = $(this).data('id');
        const caseData = casesData.find(c => c.id === id || c.lrn === id);
        if (caseData) {
            $('#edit-id').val(caseData.id || caseData.lrn);
            $('#edit-lrn').val(caseData.lrn);
            $('#edit-student-name').val(caseData.name);
            $('#edit-grade-level').val(caseData.grade.split(' ')[1]);
            $('#edit-case-type').val(caseData.typeValue);
            $('#edit-remarks').val(caseData.statusValue);
            $('#edit-incident').val(caseData.incident);
            $('#edit-actions').val(caseData.actions);
            $('#editCaseModal').modal('show');
        }
    });
    
    $(document).on('click', '.delete-btn', function() {
        const id = $(this).data('id');
        currentCaseId = id;
        $('#deleteConfirmModal').modal('show');
    });
    
    // Update case
    $('#update-case-btn').on('click', async function() {
        const id = $('#edit-id').val();
        const lrn = $('#edit-lrn').val();
        const studentName = $('#edit-student-name').val();
        const gradeLevel = $('#edit-grade-level').val();
        const caseType = $('#edit-case-type').val();
        const incident = $('#edit-incident').val();
        const actions = $('#edit-actions').val();
        const remarks = $('#edit-remarks').val();
        
        const isProhibited = prohibitedTypes.includes(caseType);
        let caseTypeDisplay = '';
        if (isProhibited) {
            caseTypeDisplay = prohibitedDisplayNames[caseType] || caseType;
        } else {
            switch(caseType) {
                case 'bullying': caseTypeDisplay = 'Bullying'; break;
                case 'academic': caseTypeDisplay = 'Academic Deficiency'; break;
                case 'behavioral': caseTypeDisplay = 'Behavioral Issue'; break;
                case 'attendance': caseTypeDisplay = 'Attendance Problem'; break;
                default: caseTypeDisplay = 'Other';
            }
        }
        
        const caseIndex = casesData.findIndex(c => c.id === id || c.lrn === id);
        if (caseIndex !== -1) {
            const wasProhibited = casesData[caseIndex].isProhibited;
            
            const updatedCase = {
                ...casesData[caseIndex],
                lrn: lrn,
                name: studentName,
                grade: 'Grade ' + gradeLevel,
                type: caseTypeDisplay,
                typeValue: caseType,
                status: $('#edit-remarks option:selected').text(),
                statusValue: remarks,
                updated: new Date().toISOString().split('T')[0],
                incident: incident,
                actions: actions,
                isProhibited: isProhibited
            };
            
            try {
                if (currentUser && currentUser.uid && !currentUser.uid.startsWith('demo_')) {
                    await updateCaseInFirestore(casesData[caseIndex].id, updatedCase);
                }
                
                casesData[caseIndex] = updatedCase;
                
                if (isProhibited && !wasProhibited) {
                    createProhibitedDocumentFromCase(updatedCase);
                }
                
                populateDataTables();
                updateProhibitedCasesList();
                updateCaseReferenceDropdown();
                localStorage.setItem('snhs_cms_cases', JSON.stringify(casesData));
                localStorage.setItem('snhs_cms_prohibited_documents', JSON.stringify(prohibitedDocumentsData));
                updateStatistics();
                $('#editCaseModal').modal('hide');
                showNotification('Case updated successfully!', 'success');
            } catch (error) {
                showNotification('Error updating case: ' + error.message, 'error');
            }
        }
    });
    
    // Confirm delete
    $('#confirm-delete-btn').on('click', async function() {
        if (currentCaseId) {
            try {
                const caseToDelete = casesData.find(c => c.id === currentCaseId || c.lrn === currentCaseId);
                if (caseToDelete && currentUser && currentUser.uid && !currentUser.uid.startsWith('demo_')) {
                    await deleteCaseFromFirestore(caseToDelete.id);
                }
                
                casesData = casesData.filter(c => c.id !== currentCaseId && c.lrn !== currentCaseId);
                populateDataTables();
                updateProhibitedCasesList();
                updateCaseReferenceDropdown();
                localStorage.setItem('snhs_cms_cases', JSON.stringify(casesData));
                updateStatistics();
                currentCaseId = null;
                $('#deleteConfirmModal').modal('hide');
                showNotification('Case deleted successfully!', 'success');
            } catch (error) {
                showNotification('Error deleting case: ' + error.message, 'error');
            }
        }
    });
    
    // View prohibited document
    $(document).on('click', '.view-prohibited-doc-btn', function() {
        const docId = $(this).data('id');
        currentDocumentId = docId;
        const document = prohibitedDocumentsData.find(d => d.id === docId);
        if (document) {
            $('#decryptProhibitedModal').modal('show');
        }
    });
    
    // Decrypt prohibited document
    $('#decrypt-prohibited-btn').on('click', function() {
        const code = $('#prohibited-decrypt-code').val();
        const document = prohibitedDocumentsData.find(d => d.id === currentDocumentId);
        
        if (document && document.encryptionCode === code) {
            $('#decryptProhibitedModal').modal('hide');
            
            if (!document.viewedBy) {
                document.viewedBy = [];
            }
            if (currentUser) {
                document.viewedBy.push({
                    user: currentUser.email,
                    timestamp: new Date().toISOString()
                });
            }
            
            showProhibitedDocument(document);
            $('#prohibited-decrypt-code').val('');
            $('#agree-prohibited-terms').prop('checked', false);
            $('#decrypt-prohibited-btn').prop('disabled', true);
            localStorage.setItem('snhs_cms_prohibited_documents', JSON.stringify(prohibitedDocumentsData));
        } else {
            showNotification('Invalid decryption code!', 'error');
        }
    });
    
    $('#agree-prohibited-terms').on('change', function() {
        $('#decrypt-prohibited-btn').prop('disabled', !$(this).is(':checked'));
    });
    
    function showProhibitedDocument(document) {
        const viewer = $('#prohibited-document-viewer');
        const content = `
            <div class="document-content">
                <h4 class="text-danger"><i class="fas fa-exclamation-triangle"></i> PROHIBITED DOCUMENT - CONFIDENTIAL</h4>
                <hr>
                <p><strong>Title:</strong> ${document.title}</p>
                <p><strong>From:</strong> ${document.senderName} (${document.sender})</p>
                <p><strong>To:</strong> ${document.recipient}</p>
                <p><strong>Date Sent:</strong> ${new Date(document.dateSent).toLocaleString()}</p>
                ${document.linkedStudentName ? `<p><strong>Related Student:</strong> ${document.linkedStudentName}</p>` : ''}
                <hr>
                <div class="p-3 bg-light">
                    <pre style="white-space: pre-wrap; font-family: inherit;">${document.content}</pre>
                </div>
                <hr>
                <p class="text-muted"><small>This document has been decrypted and viewed by authorized personnel.</small></p>
            </div>
        `;
        viewer.html(content);
        $('#viewProhibitedDocumentModal').modal('show');
    }
    
    // Search functionality
    $('#search-btn').on('click', function() {
        const searchText = $('#search-input').val().toLowerCase();
        const yearLevel = $('#year-level-filter').val();
        const caseTypeFilter = $('#case-type-filter').val();
        const statusFilter = $('#status-filter').val();
        
        if (dataTables.records) {
            dataTables.records.search(searchText).draw();
        }
    });
    
    // Export buttons
    $('#export-excel, #records-export-excel').on('click', function() {
        exportToExcel();
    });
    
    $('#export-pdf, #records-export-pdf').on('click', function() {
        exportToPDF();
    });
    
    $('#export-docx, #records-export-docx').on('click', function() {
        exportToDOCX();
    });
    
    $('#export-csv, #records-export-csv').on('click', function() {
        exportToCSV();
    });
    
    $('#print-btn, #records-print-btn').on('click', function() {
        printTable();
    });
    
    $('#print-case-btn').on('click', function() {
        printCaseDetails();
    });
    
    // Add user
    $('#add-user-btn').on('click', function() {
        $('#addUserModal').modal('show');
    });
    
    $('#save-user-btn').on('click', async function() {
        const name = $('#user-name').val();
        const email = $('#user-email').val();
        const role = $('#user-role').val();
        const password = $('#user-password').val();
        const confirmPassword = $('#user-confirm-password').val();
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match!', 'error');
            return;
        }
        
        const newUser = {
            name: name,
            email: email,
            role: role,
            status: 'active',
            lastLogin: new Date().toLocaleString(),
            createdAt: new Date().toISOString()
        };
        
        try {
            if (currentUser && currentUser.uid && !currentUser.uid.startsWith('demo_')) {
                // Create Firebase Auth user
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                await addUserToFirestore({ ...newUser, uid: userCredential.user.uid });
            }
            
            usersData.push({ ...newUser, id: 'user_' + Date.now() });
            localStorage.setItem('snhs_cms_users', JSON.stringify(usersData));
            populateUsersTable();
            $('#addUserModal').modal('hide');
            $('#add-user-form')[0].reset();
            showNotification('User added successfully!', 'success');
        } catch (error) {
            showNotification('Error adding user: ' + error.message, 'error');
        }
    });
    
    // Report form
    $('#date-range').on('change', function() {
        if ($(this).val() === 'custom') {
            $('#custom-date-range').show();
        } else {
            $('#custom-date-range').hide();
        }
    });
    
    $('#report-form').on('submit', function(e) {
        e.preventDefault();
        generateReport();
    });
    
    // View prohibited cases button
    $('#view-prohibited-btn').on('click', function() {
        showProhibitedCases();
    });
    
    // ==================== EXPORT FUNCTIONS ====================
    
    async function exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape', 'mm', 'a4');
            
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Subic National High School', 20, 20);
            doc.text('Case Management System - Student Records', 20, 30);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
            
            const hasProhibited = casesData.some(c => c.isProhibited);
            const tableData = casesData.map(c => [
                c.lrn, c.name, c.grade, c.type, c.status, c.date,
                c.isProhibited ? 'PROHIBITED' : 'Regular'
            ]);
            
            doc.autoTable({
                head: [['LRN', 'Student Name', 'Grade Level', 'Case Type', 'Status', 'Date Reported', 'Classification']],
                body: tableData,
                startY: 50,
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [158, 14, 18], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 20, right: 20 }
            });
            
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.text(`Total Cases: ${casesData.length}`, 20, finalY);
            doc.text(`Prohibited Cases: ${casesData.filter(c => c.isProhibited).length}`, 20, finalY + 5);
            doc.text(`Regular Cases: ${casesData.filter(c => !c.isProhibited).length}`, 20, finalY + 10);
            
            await applyPDFWatermark(doc, hasProhibited);
            
            const timestamp = new Date().toISOString().split('T')[0];
            doc.save(`SNHS_Student_Cases_${timestamp}.pdf`);
            showNotification('PDF file exported successfully!', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            showNotification('Error exporting to PDF. Please try again.', 'error');
        }
    }
    
    async function exportToDOCX() {
        try {
            const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;
            
            const tableRows = [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph("LRN")] }),
                        new TableCell({ children: [new Paragraph("Student Name")] }),
                        new TableCell({ children: [new Paragraph("Grade Level")] }),
                        new TableCell({ children: [new Paragraph("Case Type")] }),
                        new TableCell({ children: [new Paragraph("Status")] }),
                        new TableCell({ children: [new Paragraph("Date Reported")] }),
                        new TableCell({ children: [new Paragraph("Classification")] })
                    ]
                })
            ];
            
            casesData.forEach(c => {
                tableRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(c.lrn)] }),
                        new TableCell({ children: [new Paragraph(c.name)] }),
                        new TableCell({ children: [new Paragraph(c.grade)] }),
                        new TableCell({ children: [new Paragraph(c.type)] }),
                        new TableCell({ children: [new Paragraph(c.status)] }),
                        new TableCell({ children: [new Paragraph(c.date)] }),
                        new TableCell({ children: [new Paragraph(c.isProhibited ? 'PROHIBITED' : 'Regular')] })
                    ]
                }));
            });
            
            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
                        }
                    },
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Subic National High School", bold: true, size: 28 })],
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "Case Management System - Student Records", bold: true, size: 24 })],
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: `Generated on: ${new Date().toLocaleDateString()}`, size: 20 })],
                            alignment: AlignmentType.CENTER
                        }),
                        new Paragraph({ text: "" }),
                        new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                            children: [new TextRun({ text: `Total Cases: ${casesData.length}`, bold: true, size: 20 })]
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: `Prohibited Cases: ${casesData.filter(c => c.isProhibited).length}`, size: 20 })]
                        })
                    ]
                }]
            });
            
            const buffer = await Packer.toBuffer(doc);
            const timestamp = new Date().toISOString().split('T')[0];
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            saveAs(blob, `SNHS_Student_Cases_${timestamp}.docx`);
            showNotification('DOCX file exported successfully!', 'success');
        } catch (error) {
            console.error('DOCX export error:', error);
            showNotification('Error exporting to DOCX. Please try again.', 'error');
        }
    }
    
    function exportToCSV() {
        try {
            const headers = ['LRN', 'Student Name', 'Grade Level', 'Case Type', 'Status', 'Date Reported', 'Last Updated', 'Classification', 'Description', 'Actions Taken'];
            const csvData = casesData.map(c => [
                c.lrn,
                `"${c.name}"`,
                c.grade,
                `"${c.type}"`,
                `"${c.status}"`,
                c.date,
                c.updated || c.date,
                c.isProhibited ? 'PROHIBITED' : 'Regular',
                `"${c.incident.replace(/"/g, '""')}"`,
                `"${c.actions.replace(/"/g, '""')}"`
            ]);
            
            const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const timestamp = new Date().toISOString().split('T')[0];
            saveAs(blob, `SNHS_Student_Cases_${timestamp}.csv`);
            showNotification('CSV file exported successfully!', 'success');
        } catch (error) {
            console.error('CSV export error:', error);
            showNotification('Error exporting to CSV. Please try again.', 'error');
        }
    }
    
    function exportToExcel() {
        try {
            const wb = XLSX.utils.book_new();
            const exportData = casesData.map(c => ({
                'LRN': c.lrn,
                'Student Name': c.name,
                'Grade Level': c.grade,
                'Case Type': c.type,
                'Status': c.status,
                'Date Reported': c.date,
                'Last Updated': c.updated || c.date,
                'Classification': c.isProhibited ? 'PROHIBITED' : 'Regular',
                'Description': c.incident,
                'Actions Taken': c.actions,
                'Reported By': c.reportedBy
            }));
            
            const ws = XLSX.utils.json_to_sheet(exportData);
            ws['!cols'] = [
                { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 30 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 40 }, { wch: 40 }, { wch: 25 }
            ];
            
            XLSX.utils.book_append_sheet(wb, ws, 'Student Cases');
            const timestamp = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `SNHS_Student_Cases_${timestamp}.xlsx`);
            showNotification('Excel file exported successfully!', 'success');
        } catch (error) {
            console.error('Excel export error:', error);
            showNotification('Error exporting to Excel. Please try again.', 'error');
        }
    }
    
    function printTable() {
        const printWindow = window.open('', '_blank');
        const tableData = casesData.map(c => `
            <tr>
                <td>${c.lrn}</td>
                <td>${c.name}</td>
                <td>${c.grade}</td>
                <td>${c.type}</td>
                <td>${c.status}</td>
                <td>${c.date}</td>
                <td>${c.updated || c.date}</td>
                <td>${c.isProhibited ? 'PROHIBITED' : 'Regular'}</td>
            </tr>
        `).join('');
        
        const hasProhibited = casesData.some(c => c.isProhibited);
        const watermarkStyle = `
            .watermark-logo {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                opacity: 0.14;
                z-index: 999;
                font-size: 120px;
                color: #9e0e12;
                font-weight: bold;
                pointer-events: none;
                white-space: nowrap;
                letter-spacing: 5px;
            }
            ${hasProhibited ? `
            .watermark-confidential {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 80px;
                color: rgba(180, 180, 180, 0.14);
                pointer-events: none;
                z-index: 1000;
                font-weight: bold;
                letter-spacing: 10px;
                white-space: nowrap;
            }
            ` : ''}
            .content { position: relative; z-index: 1; }
        `;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>SNHS Student Cases Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; position: relative; }
                    h1, h2 { color: #9e0e12; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #9e0e12; color: white; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .summary { margin-top: 20px; font-weight: bold; }
                    .prohibited { color: #dc3545; font-weight: bold; }
                    ${watermarkStyle}
                </style>
            </head>
            <body>
                <div class="watermark-logo">SNHS CMS</div>
                ${hasProhibited ? '<div class="watermark-confidential">CONFIDENTIAL</div>' : ''}
                <div class="content">
                    <div class="header">
                        <h1>Subic National High School</h1>
                        <h2>Case Management System - Student Records</h2>
                        <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>LRN</th>
                                <th>Student Name</th>
                                <th>Grade Level</th>
                                <th>Case Type</th>
                                <th>Status</th>
                                <th>Date Reported</th>
                                <th>Last Updated</th>
                                <th>Classification</th>
                            </tr>
                        </thead>
                        <tbody>${tableData}</tbody>
                    </table>
                    <div class="summary">
                        <p>Total Cases: ${casesData.length}</p>
                        <p class="prohibited">Prohibited Cases: ${casesData.filter(c => c.isProhibited).length}</p>
                        <p>Regular Cases: ${casesData.filter(c => !c.isProhibited).length}</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }
    
    function printCaseDetails() {
        const printWindow = window.open('', '_blank');
        const lrn = $('#view-lrn').text();
        const caseData = casesData.find(c => c.lrn === lrn);
        
        if (caseData) {
            const isProhibited = caseData.isProhibited;
            const watermarkStyle = `
                .watermark-logo {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0.14;
                    z-index: 999;
                    font-size: 120px;
                    color: #9e0e12;
                    font-weight: bold;
                    pointer-events: none;
                    white-space: nowrap;
                    letter-spacing: 5px;
                }
                ${isProhibited ? `
                .watermark-confidential {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-30deg);
                    font-size: 80px;
                    color: rgba(180, 180, 180, 0.14);
                    pointer-events: none;
                    z-index: 1000;
                    font-weight: bold;
                    letter-spacing: 10px;
                    white-space: nowrap;
                }
                ` : ''}
                .content { position: relative; z-index: 1; }
            `;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Case Details - ${caseData.name}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; position: relative; }
                        h1, h2 { color: #9e0e12; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .case-info { margin: 20px 0; }
                        .case-info p { margin: 10px 0; }
                        .case-info strong { display: inline-block; width: 150px; }
                        .description { margin: 20px 0; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9; }
                        .classification { display: inline-block; padding: 3px 8px; border-radius: 3px; font-weight: bold; }
                        .prohibited { background-color: #dc3545; color: white; }
                        .regular { background-color: #28a745; color: white; }
                        ${watermarkStyle}
                    </style>
                </head>
                <body>
                    <div class="watermark-logo">SNHS CMS</div>
                    ${isProhibited ? '<div class="watermark-confidential">CONFIDENTIAL</div>' : ''}
                    <div class="content">
                        <div class="header">
                            <h1>Subic National High School</h1>
                            <h2>Case Management System - Case Details</h2>
                            <p>Generated on: ${new Date().toLocaleDateString()}</p>
                        </div>
                        <div class="case-info">
                            <p><strong>LRN:</strong> ${caseData.lrn}</p>
                            <p><strong>Student Name:</strong> ${caseData.name}</p>
                            <p><strong>Grade Level:</strong> ${caseData.grade}</p>
                            <p><strong>Case Type:</strong> ${caseData.type}</p>
                            <p><strong>Status:</strong> ${caseData.status}</p>
                            <p><strong>Date Reported:</strong> ${caseData.date}</p>
                            <p><strong>Last Updated:</strong> ${caseData.updated || caseData.date}</p>
                            <p><strong>Classification:</strong> 
                                <span class="classification ${caseData.isProhibited ? 'prohibited' : 'regular'}">
                                    ${caseData.isProhibited ? 'PROHIBITED' : 'REGULAR'}
                                </span>
                            </p>
                        </div>
                        <div class="description">
                            <h3>Description of Incident/Case:</h3>
                            <p>${caseData.incident}</p>
                        </div>
                        <div class="description">
                            <h3>Actions Taken:</h3>
                            <p>${caseData.actions}</p>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }
        
        printWindow.document.close();
        printWindow.print();
    }
    
    // ==================== REPORT GENERATION ====================
    
    function generateReport() {
        const reportType = $('#report-type').val();
        const dateRange = $('#date-range').val();
        const format = $('#format').val();
        
        if (!reportType) {
            showNotification('Please select a report type.', 'error');
            return;
        }
        
        const filteredData = filterDataByDateRange(casesData, dateRange);
        
        switch(reportType) {
            case 'cases-by-type':
                generateCasesByTypeReport(filteredData, format);
                break;
            case 'monthly-trend':
                generateMonthlyTrendReport(filteredData, format);
                break;
            case 'student-cases':
                generateStudentCasesReport(filteredData, format);
                break;
            case 'resolution-rate':
                generateResolutionRateReport(filteredData, format);
                break;
            case 'prohibited-cases':
                generateProhibitedCasesReport(filteredData, format);
                break;
            case 'prohibited-documents':
                generateProhibitedDocumentsReport(format);
                break;
        }
        
        showNotification('Report generated successfully!', 'success');
    }
    
    function filterDataByDateRange(data, dateRange) {
        const now = new Date();
        let startDate, endDate;
        
        switch(dateRange) {
            case 'last-7-days':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'last-30-days':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'last-90-days':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'this-year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = now;
                break;
            case 'custom':
                startDate = new Date($('#start-date').val());
                endDate = new Date($('#end-date').val());
                break;
            default:
                return data;
        }
        
        return data.filter(c => {
            const caseDate = new Date(c.date);
            return caseDate >= startDate && caseDate <= endDate;
        });
    }
    
    function generateCasesByTypeReport(data, format) {
        const typeCounts = {};
        const prohibitedCounts = {};
        data.forEach(c => {
            typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
            if (c.isProhibited) {
                prohibitedCounts[c.type] = (prohibitedCounts[c.type] || 0) + 1;
            }
        });
        const reportData = Object.entries(typeCounts).map(([type, count]) => ({
            'Case Type': type,
            'Total Cases': count,
            'Prohibited': prohibitedCounts[type] || 0,
            'Regular': count - (prohibitedCounts[type] || 0),
            'Percentage': data.length > 0 ? Math.round((count / data.length) * 100) + '%' : '0%'
        }));
        exportReport(reportData, 'Cases by Type Report', format);
    }
    
    function generateMonthlyTrendReport(data, format) {
        const monthlyCounts = {};
        data.forEach(c => {
            const month = new Date(c.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!monthlyCounts[month]) {
                monthlyCounts[month] = { total: 0, prohibited: 0, regular: 0 };
            }
            monthlyCounts[month].total++;
            if (c.isProhibited) {
                monthlyCounts[month].prohibited++;
            } else {
                monthlyCounts[month].regular++;
            }
        });
        const reportData = Object.entries(monthlyCounts).map(([month, counts]) => ({
            'Month': month,
            'Total Cases': counts.total,
            'Prohibited Cases': counts.prohibited,
            'Regular Cases': counts.regular
        }));
        exportReport(reportData, 'Monthly Trend Report', format);
    }
    
    function generateStudentCasesReport(data, format) {
        const reportData = data.map(c => ({
            'LRN': c.lrn,
            'Student Name': c.name,
            'Grade Level': c.grade,
            'Case Type': c.type,
            'Status': c.status,
            'Classification': c.isProhibited ? 'PROHIBITED' : 'REGULAR',
            'Date Reported': c.date,
            'Last Updated': c.updated || c.date,
            'Reported By': c.reportedBy
        }));
        exportReport(reportData, 'Student Cases Report', format);
    }
    
    function generateResolutionRateReport(data, format) {
        const resolved = data.filter(c => c.statusValue === 'resolved').length;
        const pending = data.filter(c => c.statusValue === 'pending').length;
        const monitoring = data.filter(c => c.statusValue === 'monitoring').length;
        const referred = data.filter(c => c.statusValue === 'referred').length;
        const prohibitedResolved = data.filter(c => c.isProhibited && c.statusValue === 'resolved').length;
        const reportData = [
            { 'Status': 'Resolved', 'Count': resolved, 'Percentage': data.length > 0 ? Math.round((resolved / data.length) * 100) + '%' : '0%' },
            { 'Status': 'Pending', 'Count': pending, 'Percentage': data.length > 0 ? Math.round((pending / data.length) * 100) + '%' : '0%' },
            { 'Status': 'Under Monitoring', 'Count': monitoring, 'Percentage': data.length > 0 ? Math.round((monitoring / data.length) * 100) + '%' : '0%' },
            { 'Status': 'Referred to Guidance', 'Count': referred, 'Percentage': data.length > 0 ? Math.round((referred / data.length) * 100) + '%' : '0%' },
            { 'Status': 'Prohibited Cases Resolved', 'Count': prohibitedResolved, 'Percentage': data.filter(c => c.isProhibited).length > 0 ? Math.round((prohibitedResolved / data.filter(c => c.isProhibited).length) * 100) + '%' : '0%' }
        ];
        exportReport(reportData, 'Resolution Rate Report', format);
    }
    
    function generateProhibitedCasesReport(data, format) {
        const prohibitedData = data.filter(c => c.isProhibited);
        const reportData = prohibitedData.map(c => ({
            'LRN': c.lrn,
            'Student Name': c.name,
            'Grade Level': c.grade,
            'Case Type': c.type,
            'Status': c.status,
            'Date Reported': c.date,
            'Last Updated': c.updated || c.date,
            'Reported By': c.reportedBy,
            'Description': c.incident
        }));
        
        if (format === 'pdf') {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('landscape', 'mm', 'a4');
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Subic National High School', 20, 20);
                doc.text('Prohibited Cases Report', 20, 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
                const headers = Object.keys(reportData[0] || {});
                const tableData = reportData.map(row => headers.map(header => row[header] || ''));
                doc.autoTable({
                    head: [headers],
                    body: tableData,
                    startY: 50,
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [158, 14, 18], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    margin: { left: 20, right: 20 }
                });
                applyPDFWatermark(doc, true);
                const timestamp = new Date().toISOString().split('T')[0];
                doc.save(`Prohibited_Cases_Report_${timestamp}.pdf`);
                showNotification('Prohibited Cases Report exported to PDF successfully!', 'success');
            } catch (error) {
                console.error('PDF export error:', error);
                showNotification('Error exporting to PDF. Please try again.', 'error');
            }
        } else {
            exportReport(reportData, 'Prohibited Cases Report', format);
        }
    }
    
    function generateProhibitedDocumentsReport(format) {
        const reportData = prohibitedDocumentsData.map(doc => ({
            'Document Title': doc.title,
            'Sender': doc.senderName,
            'Recipient': doc.recipient,
            'Date Sent': new Date(doc.dateSent).toLocaleDateString(),
            'Linked Student': doc.linkedStudentName || 'N/A',
            'Status': doc.viewedBy && doc.viewedBy.length > 0 ? 'Viewed' : 'Unviewed',
            'Times Viewed': doc.viewedBy ? doc.viewedBy.length : 0
        }));
        
        if (format === 'pdf') {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('landscape', 'mm', 'a4');
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Subic National High School', 20, 20);
                doc.text('Prohibited Documents Report', 20, 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
                const headers = Object.keys(reportData[0] || {});
                const tableData = reportData.map(row => headers.map(header => row[header] || ''));
                doc.autoTable({
                    head: [headers],
                    body: tableData,
                    startY: 50,
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [158, 14, 18], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    margin: { left: 20, right: 20 }
                });
                applyPDFWatermark(doc, true);
                const timestamp = new Date().toISOString().split('T')[0];
                doc.save(`Prohibited_Documents_Report_${timestamp}.pdf`);
                showNotification('Prohibited Documents Report exported to PDF successfully!', 'success');
            } catch (error) {
                console.error('PDF export error:', error);
                showNotification('Error exporting to PDF. Please try again.', 'error');
            }
        } else {
            exportReport(reportData, 'Prohibited Documents Report', format);
        }
    }
    
    function exportReport(data, reportName, format) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${reportName.replace(/\s+/g, '_')}_${timestamp}`;
        
        if (data.length === 0) {
            showNotification('No data to export.', 'warning');
            return;
        }
        
        if (format === 'pdf') {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('landscape', 'mm', 'a4');
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Subic National High School', 20, 20);
                doc.text(reportName, 20, 30);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40);
                const headers = Object.keys(data[0] || {});
                const tableData = data.map(row => headers.map(header => row[header] || ''));
                doc.autoTable({
                    head: [headers],
                    body: tableData,
                    startY: 50,
                    styles: { fontSize: 8, cellPadding: 3 },
                    headStyles: { fillColor: [158, 14, 18], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 245, 245] },
                    margin: { left: 20, right: 20 }
                });
                const hasProhibited = data.some(row => row['Classification'] === 'PROHIBITED' || row['Prohibited'] > 0);
                applyPDFWatermark(doc, hasProhibited);
                doc.save(`${filename}.pdf`);
                showNotification(`${reportName} exported to PDF successfully!`, 'success');
            } catch (error) {
                console.error('PDF export error:', error);
                showNotification('Error exporting to PDF. Please try again.', 'error');
            }
        } else if (format === 'excel') {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, reportName.substring(0, 31));
            XLSX.writeFile(wb, `${filename}.xlsx`);
            showNotification(`${reportName} exported to Excel successfully!`, 'success');
        } else if (format === 'csv') {
            const headers = Object.keys(data[0]);
            const csvData = data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            );
            const csvContent = [headers.join(','), ...csvData].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `${filename}.csv`);
            showNotification(`${reportName} exported to CSV successfully!`, 'success');
        } else if (format === 'html') {
            const headers = Object.keys(data[0]);
            const tableRows = data.map(row => 
                `<tr>${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}</tr>`
            ).join('');
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head><title>${reportName}</title>
                <style>body{font-family:Arial;margin:20px;}h1,h2{color:#9e0e12;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#9e0e12;color:white;}tr:nth-child(even){background-color:#f2f2f2;}.header{text-align:center;margin-bottom:30px;}</style>
                </head>
                <body>
                <div class="header"><h1>Subic National High School</h1><h2>${reportName}</h2><p>Generated on: ${new Date().toLocaleDateString()}</p></div>
                <table><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead>
                <tbody>${tableRows}</tbody></table>
                </body>
                </html>
            `;
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
            saveAs(blob, `${filename}.html`);
            showNotification(`${reportName} exported to HTML successfully!`, 'success');
        }
    }
    
    // ==================== GLOBAL FUNCTIONS ====================
    
    window.filterCases = function(filterType) {
        $('#student-cases-page').show();
        $('.page-content').hide();
        $('#student-cases-page').show();
        if (filterType === 'prohibited') {
            $('#case-type-filter').val('prohibited');
            $('#search-btn').click();
        }
    };
    
    window.showProhibitedCases = function() {
        $('.sidebar-menu li').removeClass('active');
        $('.sidebar-menu a[data-page="prohibited-documents"]').parent().addClass('active');
        $('.page-content').hide();
        $('#prohibited-documents-page').show();
        updateProhibitedCasesList();
        updateProhibitedDocumentsLists();
        updateCaseReferenceDropdown();
    };
    
    window.viewProhibitedCasesFromChart = function() {
        showProhibitedCases();
    };
    
    window.showMonthlyTrendDetails = function() {
        showNotification('Click on any point in the graph to view cases for that month', 'info');
    };
    
    function filterCasesByType(caseType) {
        $('#student-cases-page').show();
        $('.page-content').hide();
        $('#student-cases-page').show();
        showNotification(`Showing cases of type: ${caseType}`, 'info');
    }
    
    function showMonthlyCases(month, year) {
        $('#student-cases-page').show();
        $('.page-content').hide();
        $('#student-cases-page').show();
        showNotification(`Showing cases for ${month} ${year}`, 'info');
    }
    
    // Show document info
    window.showDocumentInfo = function(docId) {
        const document = prohibitedDocumentsData.find(d => d.id === docId);
        if (document) {
            const info = `
                Document: ${document.title}
                Sent to: ${document.recipient}
                Date: ${new Date(document.dateSent).toLocaleString()}
                Viewed by: ${document.viewedBy ? document.viewedBy.length : 0} recipients
            `;
            alert(info);
        }
    };
});
