class AdminService {
    // Isolated Master Veto Override logic using sandbox arrays
    executeMasterVeto(mainAdminId, targetUserId, contentId) {
        const mainAdmin = global.mockUsers.find(u => u.id === mainAdminId);
        if (!mainAdmin || !mainAdmin.root_owner_flag || mainAdmin.role !== 'main_admin') {
            throw new Error("Unauthorized Security Clearance Breach. Main Admin authority needed.");
        }

        const targetUser = global.mockUsers.find(u => u.id === parseInt(targetUserId));
        if (targetUser) {
            targetUser.account_status = 'active'; // Restore account parameters instantly
        }

        const key = `${targetUserId}-${contentId}`;
        if (global.mockAppeals[key]) {
            global.mockAppeals[key].status = 'approved';
        }

        const logCard = `[MASTER OVERRIDE: Main Admin reversed action on user ${targetUserId}. Account standing cleanly restored.]`;
        global.mockAcrLogs.push(logCard);

        return {
            status: "Success",
            message: "Administrative decision reversed completely.",
            acrMessage: logCard
        };
    }

    // Sovereign Point Clawback Rule Framework protecting against sub-admin profile bias
    executePointClawback(mainAdminId, targetUserId, pointAmount, issuingAdminId) {
        const mainAdmin = global.mockUsers.find(u => u.id === mainAdminId);
        if (!mainAdmin || !mainAdmin.root_owner_flag) {
            throw new Error("Clawback keys belong exclusively to the Root Main Admin.");
        }

        const targetUser = global.mockUsers.find(u => u.id === targetUserId);
        const issuingAdmin = global.mockUsers.find(u => u.id === issuingAdminId);

        if (!targetUser) throw new Error("Target student user profile not found.");

        // Deduct points while ensuring value stays pinned at non-negative floor metrics
        targetUser.standard_points = Math.max(0, targetUser.standard_points - pointAmount);

        const clawbackCard = `[POINT CLAWBACK: Main Admin revoked ${pointAmount} points from User ${targetUser.username} initially awarded by Admin ${issuingAdmin ? issuingAdmin.username : issuingAdminId} due to favoritism/policy violation]`;
        global.mockAcrLogs.push(clawbackCard);

        return {
            status: "Clawback Extracted",
            message: `Revoked ${pointAmount} points from ${targetUser.username}.`,
            greyedOutLogCard: clawbackCard,
            updatedBalance: targetUser.standard_points
        };
    }
}

module.exports = new AdminService();
