const express = require('express');
const path = require('path');
const { appealRateLimiter } = require('./middleware/rateLimiter');
const adminService = require('./services/adminService');
const { handleMpesaWebhookMock } = require('./services/mpesa');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock In-Memory Database for Offline Testing / Sandbox Simulation
global.mockUsers = [
    { id: 1, username: "main_owner", role: "main_admin", root_owner_flag: true, account_status: "active", standard_points: 100, enterprise_points: 50 },
    { id: 2, username: "moderator_mike", role: "admin", root_owner_flag: false, account_status: "active", standard_points: 0, enterprise_points: 0 },
    { id: 3, username: "student_sam", role: "student", root_owner_flag: false, account_status: "active", standard_points: 120, enterprise_points: 0 }
];
global.mockAppeals = {}; // Keeps track of review request hits per user-content combo
global.mockSuggestions = [];
global.mockAcrLogs = [];

// --- ROUTES ---

// 1. M-Pesa Simulated Endpoint (Disconnected from Safaricom Network)
app.post('/api/v1/billing/mpesa-callback', handleMpesaWebhookMock);

// 2. Appeal Submission Endpoint (Guarded by 3-Strike Rule Engine)
app.post('/api/v1/appeals/submit', appealRateLimiter, (req, res) => {
    const { userId, contentId, appealText } = req.body;
    const user = global.mockUsers.find(u => u.id === parseInt(userId));
    
    // Create or locate the key mapping
    const key = `${userId}-${contentId}`;
    if (!global.mockAppeals[key]) {
        global.mockAppeals[key] = { userId, contentId, appealText, status: 'pending', count: 1 };
    }
    
    res.status(200).json({ 
        message: "Appeal submitted successfully.", 
        systemStatus: `Review state set to Pending for user ${user ? user.username : userId}.` 
    });
});

// 3. Admin Master Veto (Disconnected Overrides)
app.post('/api/v1/admin/veto', (req, res) => {
    const { mainAdminId, targetUserId, contentId } = req.body;
    try {
        const outcome = adminService.executeMasterVeto(parseInt(mainAdminId), targetUserId, contentId);
        res.status(200).json(outcome);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// 4. Admin Point Control: Award & Clawback Mechanics
app.post('/api/v1/admin/points-award', (req, res) => {
    const { adminId, targetUserId, pointAmount, pointType } = req.body;
    const admin = global.mockUsers.find(u => u.id === parseInt(adminId));
    const target = global.mockUsers.find(u => u.id === parseInt(targetUserId));
    
    if (!admin || (admin.role !== 'admin' && admin.role !== 'main_admin')) {
        return res.status(403).json({ error: "Access Denied. Admin clearance required." });
    }
    if (!target) return res.status(444).json({ error: "Target student not found." });

    if (pointType === 'enterprise' && !admin.root_owner_flag) {
        return res.status(403).json({ error: "Sovereignty Lock. Only the Main Admin can award Enterprise Points." });
    }

    if (pointType === 'enterprise') {
        target.enterprise_points += parseInt(pointAmount);
    } else {
        target.standard_points += parseInt(pointAmount);
    }

    const logCard = `[POINT AWARD: Admin ${admin.username} granted +${pointAmount} ${pointType} points to ${target.username}]`;
    global.mockAcrLogs.push(logCard);

    res.status(200).json({ message: "Points awarded cleanly.", acrLog: logCard, currentBalances: target });
});

app.post('/api/v1/admin/points-clawback', (req, res) => {
    const { mainAdminId, targetUserId, pointAmount, issuingAdminId } = req.body;
    try {
        const outcome = adminService.executePointClawback(parseInt(mainAdminId), parseInt(targetUserId), parseInt(pointAmount), issuingAdminId);
        res.status(200).json(outcome);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// 5. System State Dashboard Endpoint (For Sandbox Monitoring Views)
app.get('/api/v1/sandbox/state', (req, res) => {
    res.json({
        users: global.mockUsers,
        appeals: global.mockAppeals,
        acrLogs: global.mockAcrLogs
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 SchoolBridge Standalone Server running on port ${PORT}`);
    console.log(`🌐 Sandbox UI Monitor Dashboard ready at http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
