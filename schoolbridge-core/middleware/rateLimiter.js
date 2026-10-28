// Offline Simulated 3-Strike Rate Limiter Middleware
function appealRateLimiter(req, res, next) {
    const { userId, contentId } = req.body;
    const now = new Date();
    const key = `${userId}-${contentId}`;

    const user = global.mockUsers.find(u => u.id === parseInt(userId));
    if (!user) return res.status(404).json({ error: "Student user account profile not found." });

    // Enforce immediate block if user is completely locked down
    if (user.account_status === 'suspended_system_abuse') {
        return res.status(403).json({ 
            message: "SECURITY LOCKDOWN: Account suspended for 48 hours due to continuous system abuse. Incident routed to Admin Security Section." 
        });
    }

    // Initialize or read application state cache from sandboxed in-memory array mapping
    if (!global.mockAppeals[key]) {
        global.mockAppeals[key] = {
            count: 0,
            lastAttempt: now,
            status: 'pending'
        };
    }

    const record = global.mockAppeals[key];

    if (record.status === 'final_rejection') {
        return res.status(403).json({ message: "Review Rejected - Final Decision. Case permanently locked." });
    }

    const timeDiffHours = (now - new Date(record.lastAttempt)) / (1000 * 60 * 60);
    if (timeDiffHours >= 24) {
        record.count = 0; // Reset velocity metric counter safely if 24 hours have elapsed
    }

    record.count += 1;
    record.lastAttempt = now;

    // The Progressive 3-Strike Logic Pipeline Check
    if (record.count === 4) {
        return res.status(429).json({ message: "WARNING: System Abuse Detected. You have reached your rolling 24-hour review limit." });
    }

    if (record.count === 5) {
        return res.status(429).json({ 
            message: "FINAL WARNING: Continued attempts to flood system endpoints will trigger an immediate 48-hour account lockdown and flag your phone's unique Hardware ID." 
        });
    }

    if (record.count >= 6) {
        user.account_status = 'suspended_system_abuse'; // Apply local mock isolation
        return res.status(403).json({ 
            message: "SECURITY LOCKDOWN: Account suspended for 48 hours due to continuous system abuse. Incident routed to Admin Security Section." 
        });
    }

    next();
}

module.exports = { appealRateLimiter };
