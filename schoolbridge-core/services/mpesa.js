// Disconnected Mock Safaricom Daraja Webhook Callback Simulation
function handleMpesaWebhookMock(req, res) {
    const { userId, amountPaid, mpesaReceiptCode } = req.body;

    if (!userId || !amountPaid || !mpesaReceiptCode) {
        return res.status(400).json({ error: "Missing required simulation attributes inside payload wrapper." });
    }

    const user = global.mockUsers.find(u => u.id === parseInt(userId));
    if (!user) return res.status(444).json({ error: "Student profile matched to incoming phone transaction not found." });

    // Apply simulation transformations automatically on local profiles
    user.verification_status = 'approved';
    user.badge_style = 'gold_store';
    
    // Automatically trigger immediate premium visual rewards access parameters injection
    user.unlocked_assets = ['exclusive_animated_chat_bubbles', 'premium_neon_fonts', 'gold_store_crown_wrapper'];

    res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Simulation Hook Complete. Premium Verification Profile Activated.",
        profileStatus: {
            username: user.username,
            badge: user.badge_style,
            unlockedPrivileges: user.unlocked_assets
        }
    });
}

module.exports = { handleMpesaWebhookMock };
